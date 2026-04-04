import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { createRouter, protectedProcedure, workspaceProcedure, workspaceAdminProcedure } from '../init';
import { workspaces, workspaceMembers } from '@locker/database';
import { createWorkspaceSchema, updateWorkspaceSchema, generateSlug } from '@locker/common';

export const workspacesRouter = createRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        role: workspaceMembers.role,
        storageUsed: workspaces.storageUsed,
        storageLimit: workspaces.storageLimit,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, ctx.userId));

    return memberships;
  }),

  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          ownerId: workspaces.ownerId,
          storageUsed: workspaces.storageUsed,
          storageLimit: workspaces.storageLimit,
          role: workspaceMembers.role,
          createdAt: workspaces.createdAt,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(
          and(
            eq(workspaces.slug, input.slug),
            eq(workspaceMembers.userId, ctx.userId),
          ),
        );

      if (!result) return null;
      return result;
    }),

  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      const baseSlug = generateSlug(input.name);
      let slug = baseSlug;
      let collision: { id: string } | undefined;

      for (let attempt = 0; attempt < 8; attempt += 1) {
        [collision] = await ctx.db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.slug, slug))
          .limit(1);

        if (!collision) {
          break;
        }

        const suffix = randomBytes(3).toString('hex');
        const maxBaseLength = Math.max(1, 48 - suffix.length - 1);
        slug = `${baseSlug.slice(0, maxBaseLength)}-${suffix}`;
      }

      if (collision) {
        throw new Error('Unable to generate a unique workspace slug');
      }

      const [workspace] = await ctx.db
        .insert(workspaces)
        .values({
          name: input.name,
          slug,
          ownerId: ctx.userId,
        })
        .returning();

      // Add creator as owner
      await ctx.db.insert(workspaceMembers).values({
        workspaceId: workspace!.id,
        userId: ctx.userId,
        role: 'owner',
      });

      return workspace!;
    }),

  update: workspaceAdminProcedure
    .input(updateWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name) updates.name = input.name;

      if (input.slug) {
        // Ensure unique slug
        const existing = await ctx.db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(
            and(
              eq(workspaces.slug, input.slug),
            ),
          );

        if (existing.length > 0 && existing[0]!.id !== ctx.workspaceId) {
          throw new Error('Slug already taken');
        }
        updates.slug = input.slug;
      }

      const [updated] = await ctx.db
        .update(workspaces)
        .set(updates)
        .where(eq(workspaces.id, ctx.workspaceId))
        .returning();

      return updated;
    }),

  delete: workspaceAdminProcedure
    .input(z.object({ confirm: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      if (ctx.workspaceRole !== 'owner') {
        throw new Error('Only the workspace owner can delete it');
      }

      await ctx.db.delete(workspaces).where(eq(workspaces.id, ctx.workspaceId));
      return { success: true };
    }),
});
