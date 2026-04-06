"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

function ColorPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="size-5 rounded-full transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            outline:
              value === color ? `2px solid ${color}` : "2px solid transparent",
            outlineOffset: "2px",
          }}
        />
      ))}
    </div>
  );
}

export function ManageTagsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[4]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: tagsList = [], isLoading } = trpc.tags.list.useQuery(
    undefined,
    { enabled: open },
  );

  const createTag = trpc.tags.create.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.tags.getFileTagsBatch.invalidate();
      setNewName("");
      toast.success("Tag created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTag = trpc.tags.update.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.tags.getFileTagsBatch.invalidate();
      setEditingId(null);
      toast.success("Tag updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTag = trpc.tags.delete.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.tags.getFileTagsBatch.invalidate();
      toast.success("Tag deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createTag.mutate({ name: newName.trim(), color: newColor });
  };

  const startEditing = (tag: {
    id: string;
    name: string;
    color: string | null;
  }) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color ?? TAG_COLORS[4]);
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    updateTag.mutate({
      id: editingId,
      name: editName.trim(),
      color: editColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Create and manage tags for your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : tagsList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tags yet. Create one below.
            </p>
          ) : (
            tagsList.map((tag) =>
              editingId === tag.id ? (
                <div
                  key={tag.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleUpdate}
                      disabled={!editName.trim() || updateTag.isPending}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <ColorPicker value={editColor} onChange={setEditColor} />
                </div>
              ) : (
                <div
                  key={tag.id}
                  className="flex items-center gap-2.5 rounded-lg border px-3 py-2 group"
                >
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color ?? "#6b7280" }}
                  />
                  <span className="text-sm font-medium flex-1 truncate">
                    {tag.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => startEditing(tag)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={() => deleteTag.mutate({ id: tag.id })}
                    disabled={deleteTag.isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ),
            )
          )}
        </div>

        {/* Create new tag */}
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 border-t pt-3"
        >
          <div className="flex items-center gap-2">
            <div
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: newColor }}
            />
            <Input
              placeholder="New tag name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 pb-1.5 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newName.trim() || createTag.isPending}
            >
              Add
            </Button>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
