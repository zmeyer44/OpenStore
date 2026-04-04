import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createRouter, workspaceAdminProcedure } from '../init';
import { s3ApiKeys } from '@locker/database';
import {
  generateAccessKeyId,
  generateSecretKey,
  encryptSecret,
} from '../../s3/auth';

export const s3KeysRouter = createRouter({
  list: workspaceAdminProcedure.query(async ({ ctx }) => {
    const keys = await ctx.db
      .select({
        id: s3ApiKeys.id,
        accessKeyId: s3ApiKeys.accessKeyId,
        name: s3ApiKeys.name,
        permissions: s3ApiKeys.permissions,
        isActive: s3ApiKeys.isActive,
        lastUsedAt: s3ApiKeys.lastUsedAt,
        expiresAt: s3ApiKeys.expiresAt,
        createdAt: s3ApiKeys.createdAt,
      })
      .from(s3ApiKeys)
      .where(eq(s3ApiKeys.workspaceId, ctx.workspaceId))
      .orderBy(s3ApiKeys.createdAt);

    return keys;
  }),

  create: workspaceAdminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        permissions: z.enum(['readonly', 'readwrite']).default('readwrite'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accessKeyId = generateAccessKeyId();
      const secretKey = generateSecretKey();
      const encryptedSecret = encryptSecret(secretKey);

      const [key] = await ctx.db
        .insert(s3ApiKeys)
        .values({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          accessKeyId,
          encryptedSecret,
          name: input.name,
          permissions: input.permissions,
        })
        .returning({
          id: s3ApiKeys.id,
          accessKeyId: s3ApiKeys.accessKeyId,
          name: s3ApiKeys.name,
          permissions: s3ApiKeys.permissions,
          createdAt: s3ApiKeys.createdAt,
        });

      // Return the plaintext secret — shown only once
      return {
        ...key!,
        secretKey,
      };
    }),

  revoke: workspaceAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(s3ApiKeys)
        .set({ isActive: false })
        .where(
          and(
            eq(s3ApiKeys.id, input.id),
            eq(s3ApiKeys.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return { success: true };
    }),

  delete: workspaceAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(s3ApiKeys)
        .where(
          and(
            eq(s3ApiKeys.id, input.id),
            eq(s3ApiKeys.workspaceId, ctx.workspaceId),
          ),
        );

      return { success: true };
    }),

  update: workspaceAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        permissions: z.enum(['readonly', 'readwrite']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.permissions) updates.permissions = input.permissions;

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' });
      }

      const [updated] = await ctx.db
        .update(s3ApiKeys)
        .set(updates)
        .where(
          and(
            eq(s3ApiKeys.id, input.id),
            eq(s3ApiKeys.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updated;
    }),
});
