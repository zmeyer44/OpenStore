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
  DialogFooter,
} from '@/components/ui/dialog';

export function RenameDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: { id: string; name: string; type: 'file' | 'folder' };
}) {
  const [name, setName] = useState(target.name);
  const utils = trpc.useUtils();

  const renameFile = trpc.files.rename.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
      onOpenChange(false);
      toast.success('File renamed');
    },
  });

  const renameFolder = trpc.folders.rename.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      onOpenChange(false);
      toast.success('Folder renamed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (target.type === 'file') {
      renameFile.mutate({ id: target.id, name: name.trim() });
    } else {
      renameFolder.mutate({ id: target.id, name: name.trim() });
    }
  };

  const isPending = renameFile.isPending || renameFolder.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename {target.type}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onFocus={(e) => {
              // Select name without extension for files
              if (target.type === 'file') {
                const dotIndex = target.name.lastIndexOf('.');
                if (dotIndex > 0) {
                  e.target.setSelectionRange(0, dotIndex);
                }
              } else {
                e.target.select();
              }
            }}
          />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
