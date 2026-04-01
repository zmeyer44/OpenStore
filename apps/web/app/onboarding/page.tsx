'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardDrive, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  const createWorkspace = trpc.workspaces.create.useMutation({
    onSuccess: (workspace) => {
      router.push(`/w/${workspace.slug}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createWorkspace.mutate({ name: name.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HardDrive className="size-4" />
            </div>
            <span className="text-lg font-semibold">OpenStore</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight mb-1">
            Create your workspace
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Workspaces let you organize files and collaborate with your team
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace name</label>
              <Input
                placeholder="e.g. Acme Inc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!name.trim() || createWorkspace.isPending}
            >
              {createWorkspace.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Create workspace'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
