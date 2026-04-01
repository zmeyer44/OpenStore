import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getDb } from '@openstore/database/client';
import { workspaces, workspaceMembers } from '@openstore/database/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../auth';
import { headers } from 'next/headers';

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const db = getDb();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id ?? null;

  // Resolve workspace from header
  let workspaceId: string | null = null;
  let workspaceSlug: string | null = null;
  let workspaceRole: string | null = null;

  if (userId) {
    const reqHeaders = await headers();
    const slug = reqHeaders.get('x-workspace-slug');

    if (slug) {
      const membership = await db
        .select({
          workspaceId: workspaces.id,
          slug: workspaces.slug,
          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(
          and(
            eq(workspaces.slug, slug),
            eq(workspaceMembers.userId, userId),
          ),
        )
        .limit(1);

      if (membership.length > 0) {
        workspaceId = membership[0]!.workspaceId;
        workspaceSlug = membership[0]!.slug;
        workspaceRole = membership[0]!.role;
      }
    }
  }

  return {
    db,
    session,
    userId,
    workspaceId,
    workspaceSlug,
    workspaceRole,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
