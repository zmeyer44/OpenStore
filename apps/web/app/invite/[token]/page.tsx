'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, AlertCircle } from 'lucide-react';
import { Logo } from '@/assets/logo';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const { data: invite, isLoading } = trpc.members.getInviteInfo.useQuery({
    token,
  });

  const acceptInvite = trpc.members.acceptInvite.useMutation({
    onSuccess: (result) => {
      toast.success('You have joined the workspace!');
      router.push(`/w/${result.workspaceSlug}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invite || invite.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
          <AlertCircle className="size-8 text-muted-foreground/50 mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Invalid invitation</h1>
          <p className="text-sm text-muted-foreground">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <Button className="mt-4" onClick={() => router.push('/')}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
          <AlertCircle className="size-8 text-muted-foreground/50 mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Invitation expired</h1>
          <p className="text-sm text-muted-foreground">
            This invitation has expired. Ask the workspace admin to send a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Logo className="size-8 text-primary" />
          <span className="text-lg font-semibold">OpenStore</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              Join {invite.workspaceName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {invite.inviterName} invited you as {invite.role}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          You&apos;ve been invited to join <strong>{invite.workspaceName}</strong> on
          OpenStore. Accept the invitation to start collaborating.
        </p>

        <Button
          className="w-full"
          onClick={() => acceptInvite.mutate({ token })}
          disabled={acceptInvite.isPending}
        >
          {acceptInvite.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            'Accept invitation'
          )}
        </Button>
      </div>
    </div>
  );
}
