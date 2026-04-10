import { tool } from "ai";
import { z } from "zod/v4";
import { eq, and, count } from "drizzle-orm";
import {
  workspaces,
  workspaceMembers,
  files,
  folders,
  users,
} from "@locker/database";
import type { AssistantToolContext } from "./types";

export function createWorkspaceTools(ctx: AssistantToolContext) {
  return {
    getWorkspaceInfo: tool({
      description:
        "Get information about the current workspace including name, storage usage, and counts.",
      inputSchema: z.object({}),
      execute: async () => {
        const [workspace] = await ctx.db
          .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            storageUsed: workspaces.storageUsed,
            storageLimit: workspaces.storageLimit,
            createdAt: workspaces.createdAt,
          })
          .from(workspaces)
          .where(eq(workspaces.id, ctx.workspaceId))
          .limit(1);

        if (!workspace) return { error: "Workspace not found" };

        const [fileCount] = await ctx.db
          .select({ count: count() })
          .from(files)
          .where(
            and(
              eq(files.workspaceId, ctx.workspaceId),
              eq(files.status, "ready"),
            ),
          );

        const [folderCount] = await ctx.db
          .select({ count: count() })
          .from(folders)
          .where(eq(folders.workspaceId, ctx.workspaceId));

        const [memberCount] = await ctx.db
          .select({ count: count() })
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, ctx.workspaceId));

        return {
          workspace: {
            ...workspace,
            fileCount: fileCount?.count ?? 0,
            folderCount: folderCount?.count ?? 0,
            memberCount: memberCount?.count ?? 0,
          },
        };
      },
    }),

    listMembers: tool({
      description: "List all members of the current workspace.",
      inputSchema: z.object({}),
      execute: async () => {
        const members = await ctx.db
          .select({
            id: workspaceMembers.id,
            userId: workspaceMembers.userId,
            role: workspaceMembers.role,
            createdAt: workspaceMembers.createdAt,
            userName: users.name,
          })
          .from(workspaceMembers)
          .innerJoin(users, eq(users.id, workspaceMembers.userId))
          .where(eq(workspaceMembers.workspaceId, ctx.workspaceId));

        return { members };
      },
    }),
  };
}
