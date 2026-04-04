import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createRouter, workspaceProcedure, publicProcedure } from "../init";
import { shareLinks, files, folders } from "@locker/database";
import { createShareLinkSchema, SHARE_TOKEN_LENGTH } from "@locker/common";
import { createStorageForFile } from "../../../server/storage";
import { hashLinkPassword, verifyLinkPassword } from "../../security/password";

function generateToken(): string {
  return randomBytes(SHARE_TOKEN_LENGTH).toString("hex");
}

export const sharesRouter = createRouter({
  list: workspaceProcedure.query(async ({ ctx }) => {
    const links = await ctx.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.workspaceId, ctx.workspaceId))
      .orderBy(shareLinks.createdAt);

    // Enrich with file/folder names
    const enriched = await Promise.all(
      links.map(async (link) => {
        let itemName = "Unknown";
        let itemType: "file" | "folder" = "file";

        if (link.fileId) {
          const [file] = await ctx.db
            .select({ name: files.name })
            .from(files)
            .where(eq(files.id, link.fileId));
          itemName = file?.name ?? "Deleted file";
          itemType = "file";
        } else if (link.folderId) {
          const [folder] = await ctx.db
            .select({ name: folders.name })
            .from(folders)
            .where(eq(folders.id, link.folderId));
          itemName = folder?.name ?? "Deleted folder";
          itemType = "folder";
        }

        return { ...link, itemName, itemType };
      }),
    );

    return enriched;
  }),

  create: workspaceProcedure
    .input(createShareLinkSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.fileId && !input.folderId) {
        throw new Error("Must specify either fileId or folderId");
      }

      // Validate ownership
      if (input.fileId) {
        const [file] = await ctx.db
          .select()
          .from(files)
          .where(
            and(
              eq(files.id, input.fileId),
              eq(files.workspaceId, ctx.workspaceId),
            ),
          );
        if (!file) throw new Error("File not found");
      }

      if (input.folderId) {
        const [folder] = await ctx.db
          .select()
          .from(folders)
          .where(
            and(
              eq(folders.id, input.folderId),
              eq(folders.workspaceId, ctx.workspaceId),
            ),
          );
        if (!folder) throw new Error("Folder not found");
      }

      const token = generateToken();

      const [link] = await ctx.db
        .insert(shareLinks)
        .values({
          userId: ctx.userId,
          workspaceId: ctx.workspaceId,
          fileId: input.fileId ?? null,
          folderId: input.folderId ?? null,
          token,
          access: input.access,
          hasPassword: !!input.password,
          passwordHash: input.password
            ? hashLinkPassword(input.password)
            : null,
          expiresAt: input.expiresAt ?? null,
          maxDownloads: input.maxDownloads ?? null,
        })
        .returning();

      return {
        ...link,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${token}`,
      };
    }),

  revoke: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(shareLinks)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(shareLinks.id, input.id),
            eq(shareLinks.workspaceId, ctx.workspaceId),
          ),
        );

      return { success: true };
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(shareLinks)
        .where(
          and(
            eq(shareLinks.id, input.id),
            eq(shareLinks.workspaceId, ctx.workspaceId),
          ),
        );

      return { success: true };
    }),

  // Public: access a shared file/folder
  access: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [link] = await ctx.db
        .select()
        .from(shareLinks)
        .where(eq(shareLinks.token, input.token));

      if (!link || !link.isActive) {
        return { error: "Link not found or has been revoked" };
      }

      // Check expiry
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return { error: "This link has expired" };
      }

      // Check max downloads
      if (
        link.access === "download" &&
        link.maxDownloads &&
        link.downloadCount >= link.maxDownloads
      ) {
        return { error: "Download limit reached" };
      }

      // Check password
      if (link.hasPassword) {
        if (!input.password) {
          return { requiresPassword: true };
        }
        if (!verifyLinkPassword(input.password, link.passwordHash)) {
          return { error: "Incorrect password" };
        }
      }

      // Get the shared item
      let sharedItem: {
        type: "file" | "folder";
        name: string;
        size?: number;
        mimeType?: string;
        files?: { id: string; name: string; size: number; mimeType: string }[];
      } | null = null;

      if (link.fileId) {
        const [file] = await ctx.db
          .select()
          .from(files)
          .where(eq(files.id, link.fileId));
        if (file) {
          sharedItem = {
            type: "file",
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
          };
        }
      } else if (link.folderId) {
        const [folder] = await ctx.db
          .select()
          .from(folders)
          .where(eq(folders.id, link.folderId));
        const folderFiles = await ctx.db
          .select({
            id: files.id,
            name: files.name,
            size: files.size,
            mimeType: files.mimeType,
          })
          .from(files)
          .where(eq(files.folderId, link.folderId));

        if (folder) {
          sharedItem = {
            type: "folder",
            name: folder.name,
            files: folderFiles,
          };
        }
      }

      // Update access stats
      await ctx.db
        .update(shareLinks)
        .set({
          lastAccessedAt: new Date(),
        })
        .where(eq(shareLinks.id, link.id));

      return { item: sharedItem, access: link.access };
    }),

  getDownloadUrl: publicProcedure
    .input(
      z.object({
        token: z.string(),
        fileId: z.string().uuid().optional(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [link] = await ctx.db
        .select()
        .from(shareLinks)
        .where(eq(shareLinks.token, input.token));

      if (!link || !link.isActive) throw new Error("Link not found");
      if (link.access !== "download") throw new Error("Download not allowed");
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        throw new Error("Link expired");
      }
      if (
        link.hasPassword &&
        !verifyLinkPassword(input.password, link.passwordHash)
      ) {
        throw new Error("Incorrect password");
      }
      if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
        throw new Error("Download limit reached");
      }

      const queryConditions = [
        eq(files.workspaceId, link.workspaceId),
        eq(files.status, "ready"),
      ];

      if (link.fileId) {
        if (input.fileId && input.fileId !== link.fileId) {
          throw new Error("File not found");
        }
        queryConditions.push(eq(files.id, link.fileId));
      } else if (link.folderId) {
        if (!input.fileId) throw new Error("No file specified");
        queryConditions.push(eq(files.id, input.fileId));
        queryConditions.push(eq(files.folderId, link.folderId));
      } else {
        throw new Error("Link target not found");
      }

      const [file] = await ctx.db
        .select()
        .from(files)
        .where(and(...queryConditions));
      if (!file) throw new Error("File not found");

      const storage = await createStorageForFile(file.storageConfigId);
      const url = await storage.getSignedUrl(file.storagePath, 3600);

      const [updated] = await ctx.db
        .update(shareLinks)
        .set({
          downloadCount: sql`${shareLinks.downloadCount} + 1`,
          lastAccessedAt: new Date(),
        })
        .where(
          and(
            eq(shareLinks.id, link.id),
            sql`${shareLinks.maxDownloads} is null or ${shareLinks.downloadCount} < ${shareLinks.maxDownloads}`,
          ),
        )
        .returning({ id: shareLinks.id });

      if (!updated) {
        throw new Error("Download limit reached");
      }

      return { url, filename: file.name };
    }),
});
