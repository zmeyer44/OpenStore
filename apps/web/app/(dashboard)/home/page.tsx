import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { headers } from 'next/headers';
import { getDb } from '@locker/database/client';
import { workspaceMembers, workspaces } from '@locker/database';
import { eq } from 'drizzle-orm';

export default async function DashboardRootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  const db = getDb();
  const [membership] = await db
    .select({ slug: workspaces.slug })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, session.user.id))
    .limit(1);

  if (membership) {
    redirect(`/w/${membership.slug}`);
  }

  // No workspace yet - redirect to onboarding
  redirect('/onboarding');
}
