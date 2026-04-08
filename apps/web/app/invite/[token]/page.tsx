"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { Logo } from "@/assets/logo";
import { useSession } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  // Not logged in — prompt to login or register
  if (!sessionLoading && !session?.user) {
    const redirectPath = `/invite/${token}`;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <span className="text-lg font-semibold">Locker</span>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                You&apos;ve been invited
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in or create an account to accept
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link
                href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              >
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectPath)}`}
              >
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Session loading
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Logged in — show invite details
  return <InviteDetails token={token} />;
}

function InviteDetails({ token }: { token: string }) {
  const router = useRouter();

  const { data: invite, isLoading } = trpc.members.getInviteInfo.useQuery({
    token,
  });

  const acceptInvite = trpc.members.acceptInvite.useMutation({
    onSuccess: (result) => {
      toast.success("You have joined the workspace!");
      router.push(`/w/${result.workspaceSlug}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invite || invite.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
          <AlertCircle className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <h1 className="mb-1 text-lg font-semibold">Invalid invitation</h1>
          <p className="text-sm text-muted-foreground">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <Button className="mt-4" onClick={() => router.push("/home")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
          <AlertCircle className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <h1 className="mb-1 text-lg font-semibold">Invitation expired</h1>
          <p className="text-sm text-muted-foreground">
            This invitation has expired. Ask the workspace admin to send a new
            one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <div className="mb-6 flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <span className="text-lg font-semibold">Locker</span>
        </div>

        <div className="mb-4 flex items-center gap-3">
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

        <p className="mb-6 text-sm text-muted-foreground">
          You&apos;ve been invited to join{" "}
          <strong>{invite.workspaceName}</strong> on Locker. Accept the
          invitation to start collaborating.
        </p>

        <Button
          className="w-full"
          onClick={() => acceptInvite.mutate({ token })}
          disabled={acceptInvite.isPending}
        >
          {acceptInvite.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Accept invitation"
          )}
        </Button>
      </div>
    </div>
  );
}
