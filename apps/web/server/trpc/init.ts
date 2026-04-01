import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      session: ctx.session,
    },
  });
});

export const workspaceProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.workspaceId || !ctx.workspaceRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Workspace not found or access denied',
      });
    }
    return next({
      ctx: {
        ...ctx,
        workspaceId: ctx.workspaceId,
        workspaceSlug: ctx.workspaceSlug!,
        workspaceRole: ctx.workspaceRole,
      },
    });
  },
);

export const workspaceAdminProcedure = workspaceProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.workspaceRole !== 'owner' && ctx.workspaceRole !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
    return next({ ctx });
  },
);
