import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { createRouter, workspaceProcedure } from '../init';
import { workspaces, files, folders } from '@openstore/database';

export const storageRouter = createRouter({
  usage: workspaceProcedure.query(async ({ ctx }) => {
    const [workspace] = await ctx.db
      .select({
        storageUsed: workspaces.storageUsed,
        storageLimit: workspaces.storageLimit,
      })
      .from(workspaces)
      .where(eq(workspaces.id, ctx.workspaceId));

    const [fileCount] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.workspaceId, ctx.workspaceId));

    const [folderCount] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(folders)
      .where(eq(folders.workspaceId, ctx.workspaceId));

    return {
      used: workspace?.storageUsed ?? 0,
      limit: workspace?.storageLimit ?? 0,
      fileCount: Number(fileCount?.count ?? 0),
      folderCount: Number(folderCount?.count ?? 0),
      percentage: workspace
        ? Math.round(((workspace.storageUsed ?? 0) / (workspace.storageLimit ?? 1)) * 100)
        : 0,
    };
  }),
});
