import { randomBytes } from "node:crypto";
import { tool } from "ai";
import { z } from "zod/v4";
import { eq, and, desc, inArray } from "drizzle-orm";
import { shareLinks, files, folders } from "@locker/database";
import { hashLinkPassword } from "../../security/password";
import type { AssistantToolContext } from "./types";

export function createShareTools(ctx: AssistantToolContext) {
  /** Strip placeholder / junk values that LLMs sometimes hallucinate. */
  function sanitizeOpts(opts: {
    password?: string;
    expiresAt?: string;
    maxDownloads?: number;
  }) {
    // Treat non-alphanumeric-only strings (e.g. "/", "-", "none") as no password
    const password =
      opts.password && /[a-zA-Z0-9]/.test(opts.password)
        ? opts.password
        : undefined;

    // Must be a parseable future date
    const parsed = opts.expiresAt ? new Date(opts.expiresAt) : null;
    const expiresAt =
      parsed && !isNaN(parsed.getTime()) && parsed > new Date()
        ? opts.expiresAt
        : undefined;

    // Cap at a reasonable ceiling; discard absurd values like MAX_SAFE_INTEGER
    const MAX_REASONABLE_DOWNLOADS = 10_000;
    const maxDownloads =
      opts.maxDownloads &&
      opts.maxDownloads > 0 &&
      opts.maxDownloads <= MAX_REASONABLE_DOWNLOADS
        ? opts.maxDownloads
        : undefined;

    return { password, expiresAt, maxDownloads };
  }

  async function createLink(opts: {
    fileId: string | null;
    folderId: string | null;
    access: "view" | "download";
    password?: string;
    expiresAt?: string;
    maxDownloads?: number;
  }) {
    const { password, expiresAt, maxDownloads } = sanitizeOpts(opts);

    const token = randomBytes(32).toString("base64url");
    const hasPassword = !!password;
    const passwordHash = password ? hashLinkPassword(password) : null;

    const [link] = await ctx.db
      .insert(shareLinks)
      .values({
        userId: ctx.userId,
        workspaceId: ctx.workspaceId,
        fileId: opts.fileId,
        folderId: opts.folderId,
        token,
        access: opts.access,
        hasPassword,
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxDownloads: maxDownloads ?? null,
      })
      .returning();

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${token}`;
    return { shareLink: link, shareUrl };
  }

  return {
    shareFile: tool({
      description:
        "Create a share link for a file. Returns the public URL. Use shareFolder instead if sharing a folder. Do not add a password, expiration, or download limit unless the user explicitly asks for one.",
      inputSchema: z.object({
        fileId: z
          .string()
          .uuid()
          .describe("ID of the file to share"),
        access: z
          .enum(["view", "download"])
          .default("view")
          .describe("Access level for the share link"),
        password: z
          .string()
          .min(1)
          .optional()
          .describe("Optional password to protect the link"),
        expiresAt: z
          .string()
          .min(1)
          .optional()
          .describe("Optional ISO date string for link expiration"),
        maxDownloads: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional maximum number of downloads"),
      }),
      execute: async ({ fileId, access, password, expiresAt, maxDownloads }) => {
        const [file] = await ctx.db
          .select({ id: files.id })
          .from(files)
          .where(
            and(
              eq(files.id, fileId),
              eq(files.workspaceId, ctx.workspaceId),
            ),
          )
          .limit(1);

        if (!file) return { error: "File not found" };

        return createLink({
          fileId,
          folderId: null,
          access,
          password,
          expiresAt,
          maxDownloads,
        });
      },
    }),

    shareFolder: tool({
      description:
        "Create a share link for a folder. Returns the public URL. Use shareFile instead if sharing a file. Do not add a password, expiration, or download limit unless the user explicitly asks for one.",
      inputSchema: z.object({
        folderId: z
          .string()
          .uuid()
          .describe("ID of the folder to share"),
        access: z
          .enum(["view", "download"])
          .default("view")
          .describe("Access level for the share link"),
        password: z
          .string()
          .min(1)
          .optional()
          .describe("Optional password to protect the link"),
        expiresAt: z
          .string()
          .min(1)
          .optional()
          .describe("Optional ISO date string for link expiration"),
        maxDownloads: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional maximum number of downloads"),
      }),
      execute: async ({
        folderId,
        access,
        password,
        expiresAt,
        maxDownloads,
      }) => {
        const [folder] = await ctx.db
          .select({ id: folders.id })
          .from(folders)
          .where(
            and(
              eq(folders.id, folderId),
              eq(folders.workspaceId, ctx.workspaceId),
            ),
          )
          .limit(1);

        if (!folder) return { error: "Folder not found" };

        return createLink({
          fileId: null,
          folderId,
          access,
          password,
          expiresAt,
          maxDownloads,
        });
      },
    }),

    listShareLinks: tool({
      description:
        "List all share links in the workspace with their target file/folder names.",
      inputSchema: z.object({}),
      execute: async () => {
        const links = await ctx.db
          .select()
          .from(shareLinks)
          .where(eq(shareLinks.workspaceId, ctx.workspaceId))
          .orderBy(desc(shareLinks.createdAt))
          .limit(50);

        // Batch-fetch file and folder names to avoid N+1 queries
        const fileIds = links
          .map((l) => l.fileId)
          .filter((id): id is string => id != null);
        const folderIds = links
          .map((l) => l.folderId)
          .filter((id): id is string => id != null);

        const fileNameMap = new Map<string, string>();
        const folderNameMap = new Map<string, string>();

        if (fileIds.length > 0) {
          const fileRows = await ctx.db
            .select({ id: files.id, name: files.name })
            .from(files)
            .where(inArray(files.id, fileIds));
          for (const f of fileRows) fileNameMap.set(f.id, f.name);
        }

        if (folderIds.length > 0) {
          const folderRows = await ctx.db
            .select({ id: folders.id, name: folders.name })
            .from(folders)
            .where(inArray(folders.id, folderIds));
          for (const f of folderRows) folderNameMap.set(f.id, f.name);
        }

        const enriched = links.map((link) => {
          let itemName = "Unknown";
          let itemType: "file" | "folder" = "file";

          if (link.fileId) {
            itemName = fileNameMap.get(link.fileId) ?? "Unknown";
          } else if (link.folderId) {
            itemName = folderNameMap.get(link.folderId) ?? "Unknown";
            itemType = "folder";
          }

          return {
            id: link.id,
            token: link.token,
            itemName,
            itemType,
            access: link.access,
            isActive: link.isActive,
            hasPassword: link.hasPassword,
            expiresAt: link.expiresAt,
            downloadCount: link.downloadCount,
            maxDownloads: link.maxDownloads,
            shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${link.token}`,
            createdAt: link.createdAt,
          };
        });

        return { shareLinks: enriched };
      },
    }),

    revokeShareLink: tool({
      description: "Revoke (disable) a share link so it can no longer be used.",
      inputSchema: z.object({
        shareLinkId: z
          .string()
          .uuid()
          .describe("ID of the share link to revoke"),
      }),
      execute: async ({ shareLinkId }) => {
        const [link] = await ctx.db
          .update(shareLinks)
          .set({ isActive: false, updatedAt: new Date() })
          .where(
            and(
              eq(shareLinks.id, shareLinkId),
              eq(shareLinks.workspaceId, ctx.workspaceId),
            ),
          )
          .returning();

        if (!link) {
          return { error: "Share link not found" };
        }

        return { success: true, revokedLinkId: shareLinkId };
      },
    }),
  };
}
