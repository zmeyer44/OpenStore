"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Loader2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/avatar";
import { signOut } from "@/lib/auth/client";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: user, isLoading } = trpc.users.me.useQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      setName(user.name ?? "");
      setEmail(user.email);
      setInitialized(true);
    }
  }, [user, initialized]);

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.me.invalidate();
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAccount = trpc.users.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.success("Account deleted");
      await signOut();
      router.push("/login");
    },
    onError: (err) => toast.error(err.message),
  });

  const hasProfileChanges =
    user && (name !== (user.name ?? "") || email !== user.email);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.name || user.email.split("@")[0];

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex flex-1 items-center gap-2 px-4">
          <User className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Account Settings</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 p-6">
        {/* Profile section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="space-y-5 rounded-lg border bg-card p-4">
            {/* Avatar display */}
            <div className="flex items-center gap-4">
              <Avatar
                name={displayName}
                src={user.image}
                width={56}
                className="size-14 rounded-full"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Display name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {hasProfileChanges && (
              <Button
                onClick={() =>
                  updateProfile.mutate({
                    name: name || undefined,
                    email: email !== user.email ? email : undefined,
                  })
                }
                disabled={updateProfile.isPending}
                size="sm"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Password section */}
        <ChangePasswordSection hasPassword={user.hasPassword} />

        {/* Danger zone */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-destructive">
            Danger zone
          </h2>
          <div className="rounded-lg border border-destructive/20 bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and remove your data
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete your account? This cannot be undone.",
                    )
                  ) {
                    deleteAccount.mutate({ confirm: true });
                  }
                }}
                disabled={deleteAccount.isPending}
              >
                <Trash2 />
                Delete account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const canSubmit =
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    (hasPassword ? currentPassword.length > 0 : true);

  const handleChangePassword = async () => {
    if (!canSubmit) return;
    setIsPending(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message ?? "Failed to change password");
      }

      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Password</h2>
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {hasPassword
              ? "Update your password"
              : "Set a password for your account"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? (
              <EyeOff className="mr-1 size-3" />
            ) : (
              <Eye className="mr-1 size-3" />
            )}
            {showPasswords ? "Hide" : "Show"}
          </Button>
        </div>

        {hasPassword && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Current password</label>
            <Input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">New password</label>
          <Input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm new password</label>
          <Input
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={!canSubmit || isPending}
          size="sm"
        >
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <KeyRound className="size-3.5" />
              {hasPassword ? "Update password" : "Set password"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
