'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
}) {
  const [name, setName] = useState('');
  const utils = trpc.useUtils();

  const createFolder = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      onOpenChange(false);
      setName('');
      toast.success('Folder created');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createFolder.mutate({ name: name.trim(), parentId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>
            Create a new folder{parentId ? ' in this directory' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Input
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createFolder.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
