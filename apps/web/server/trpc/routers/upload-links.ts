import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { createRouter, workspaceProcedure, publicProcedure } from '../init';
import { uploadLinks, folders } from '@locker/database';
import { createUploadLinkSchema, UPLOAD_TOKEN_LENGTH } from '@locker/common';
import {
  hashLinkPassword,
  verifyLinkPassword,
} from '../../security/password';

function generateToken(): string {
  return randomBytes(UPLOAD_TOKEN_LENGTH).toString('hex');
}

export const uploadLinksRouter = createRouter({
  list: workspaceProcedure.query(async ({ ctx }) => {
    const links = await ctx.db
      .select()
      .from(uploadLinks)
      .where(eq(uploadLinks.workspaceId, ctx.workspaceId))
      .orderBy(uploadLinks.createdAt);

    // Enrich with folder names
    const enriched = await Promise.all(
      links.map(async (link) => {
        let folderName: string | null = null;
        if (link.folderId) {
          const [folder] = await ctx.db
            .select({ name: folders.name })
            .from(folders)
            .where(eq(folders.id, link.folderId));
          folderName = folder?.name ?? null;
        }
        return { ...link, folderName };
      }),
    );

    return enriched;
  }),

  create: workspaceProcedure
    .input(createUploadLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate folder belongs to user
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
        if (!folder) throw new Error('Folder not found');
      }

      const token = generateToken();

      const [link] = await ctx.db
        .insert(uploadLinks)
        .values({
          userId: ctx.userId,
          workspaceId: ctx.workspaceId,
          folderId: input.folderId ?? null,
          token,
          name: input.name,
          maxFiles: input.maxFiles ?? null,
          maxFileSize: input.maxFileSize ?? null,
          allowedMimeTypes: input.allowedMimeTypes ?? null,
          hasPassword: !!input.password,
          passwordHash: input.password ? hashLinkPassword(input.password) : null,
          expiresAt: input.expiresAt ?? null,
        })
        .returning();

      return {
        ...link,
        uploadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upload/${token}`,
      };
    }),

  revoke: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(uploadLinks)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(uploadLinks.id, input.id),
            eq(uploadLinks.workspaceId, ctx.workspaceId),
          ),
        );

      return { success: true };
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(uploadLinks)
        .where(
          and(
            eq(uploadLinks.id, input.id),
            eq(uploadLinks.workspaceId, ctx.workspaceId),
          ),
        );

      return { success: true };
    }),

  // Public: validate an upload link
  validate: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [link] = await ctx.db
        .select()
        .from(uploadLinks)
        .where(eq(uploadLinks.token, input.token));

      if (!link || !link.isActive) {
        return { error: 'Upload link not found or has been revoked' };
      }

      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return { error: 'This upload link has expired' };
      }

      if (link.maxFiles && link.filesUploaded >= link.maxFiles) {
        return { error: 'Upload limit reached' };
      }

      if (link.hasPassword) {
        if (!input.password) {
          return { requiresPassword: true };
        }
        if (!verifyLinkPassword(input.password, link.passwordHash)) {
          return { error: 'Incorrect password' };
        }
      }

      return {
        name: link.name,
        maxFiles: link.maxFiles,
        maxFileSize: link.maxFileSize,
        allowedMimeTypes: link.allowedMimeTypes,
        filesUploaded: link.filesUploaded,
        remainingUploads: link.maxFiles
          ? link.maxFiles - link.filesUploaded
          : null,
      };
    }),
});
