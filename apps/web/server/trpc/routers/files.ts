import { z } from 'zod';
import { eq, and, asc, desc, isNull, sql, ilike } from 'drizzle-orm';
import { createRouter, workspaceProcedure } from '../init';
import { files, workspaces, folders } from '@openstore/database';
import { createStorage } from '@openstore/storage';
import { renameFileSchema, moveItemSchema, paginationSchema, sortSchema } from '@openstore/common';

export const filesRouter = createRouter({
  list: workspaceProcedure
    .input(
      z.object({
        folderId: z.string().uuid().nullable().default(null),
        search: z.string().optional(),
        ...paginationSchema.shape,
        ...sortSchema.shape,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { folderId, search, page, pageSize, field, direction } = input;

      const conditions = [eq(files.workspaceId, ctx.workspaceId)];

      if (search) {
        conditions.push(ilike(files.name, `%${search}%`));
      } else {
        conditions.push(
          folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
        );
      }

      const orderBy =
        direction === 'asc' ? asc(files[field]) : desc(files[field]);

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(files)
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        db
          .select({ count: sql<number>`count(*)` })
          .from(files)
          .where(and(...conditions)),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  get: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select()
        .from(files)
        .where(and(eq(files.id, input.id), eq(files.workspaceId, ctx.workspaceId)));

      if (!file) return null;
      return file;
    }),

  getDownloadUrl: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select()
        .from(files)
        .where(and(eq(files.id, input.id), eq(files.workspaceId, ctx.workspaceId)));

      if (!file) throw new Error('File not found');

      const storage = createStorage();
      const url = await storage.getSignedUrl(file.storagePath, 3600);
      return { url, filename: file.name, mimeType: file.mimeType };
    }),

  rename: workspaceProcedure
    .input(renameFileSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(files)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(files.id, input.id), eq(files.workspaceId, ctx.workspaceId)))
        .returning();

      return updated;
    }),

  move: workspaceProcedure
    .input(moveItemSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate target folder belongs to user
      if (input.targetFolderId) {
        const [folder] = await ctx.db
          .select()
          .from(folders)
          .where(
            and(
              eq(folders.id, input.targetFolderId),
              eq(folders.workspaceId, ctx.workspaceId),
            ),
          );
        if (!folder) throw new Error('Target folder not found');
      }

      const [updated] = await ctx.db
        .update(files)
        .set({ folderId: input.targetFolderId, updatedAt: new Date() })
        .where(and(eq(files.id, input.id), eq(files.workspaceId, ctx.workspaceId)))
        .returning();

      return updated;
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select()
        .from(files)
        .where(and(eq(files.id, input.id), eq(files.workspaceId, ctx.workspaceId)));

      if (!file) throw new Error('File not found');

      // Delete from storage
      const storage = createStorage();
      await storage.delete(file.storagePath);

      // Delete from database
      await ctx.db.delete(files).where(eq(files.id, input.id));

      // Update storage usage
      await ctx.db
        .update(workspaces)
        .set({ storageUsed: sql`GREATEST(${workspaces.storageUsed} - ${file.size}, 0)` })
        .where(eq(workspaces.id, ctx.workspaceId));

      return { success: true };
    }),

  deleteMany: workspaceProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const storage = createStorage();
      let totalSize = 0;

      for (const id of input.ids) {
        const [file] = await ctx.db
          .select()
          .from(files)
          .where(and(eq(files.id, id), eq(files.workspaceId, ctx.workspaceId)));

        if (file) {
          await storage.delete(file.storagePath);
          await ctx.db.delete(files).where(eq(files.id, id));
          totalSize += file.size;
        }
      }

      if (totalSize > 0) {
        await ctx.db
          .update(workspaces)
          .set({ storageUsed: sql`GREATEST(${workspaces.storageUsed} - ${totalSize}, 0)` })
          .where(eq(workspaces.id, ctx.workspaceId));
      }

      return { success: true, deleted: input.ids.length };
    }),
});
