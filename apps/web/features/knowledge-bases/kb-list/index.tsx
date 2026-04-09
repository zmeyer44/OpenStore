"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_SCHEMA_PROMPT = `Organize information into clear topic pages. Each page should cover one concept or entity.
Use [[page-slug]] to link between related pages.
Include a summary section at the top of each page.`;

export function KBListPage() {
  const workspace = useWorkspace();
  const prefix = `/w/${workspace.slug}`;
  const utils = trpc.useUtils();

  const { data: knowledgeBases, isLoading } =
    trpc.knowledgeBases.list.useQuery();
  const { data: allTags } = trpc.tags.list.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [schemaPrompt, setSchemaPrompt] = useState(DEFAULT_SCHEMA_PROMPT);

  const createMutation = trpc.knowledgeBases.create.useMutation({
    onSuccess: async () => {
      await utils.knowledgeBases.list.invalidate();
      setCreateOpen(false);
      resetForm();
      toast.success("Knowledge base created");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.knowledgeBases.delete.useMutation({
    onSuccess: async () => {
      await utils.knowledgeBases.list.invalidate();
      setDeleteId(null);
      toast.success("Knowledge base deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  function resetForm() {
    setName("");
    setTagIds([]);
    setDescription("");
    setSchemaPrompt(DEFAULT_SCHEMA_PROMPT);
  }

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex flex-1 items-center gap-2 px-4">
          <BookOpen className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Knowledge Base</span>
        </div>
        <div className="px-4">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            Create Knowledge Base
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {isLoading ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Loading knowledge bases...
          </div>
        ) : !knowledgeBases || knowledgeBases.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <BookOpen className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No knowledge bases yet. Create one to start building a wiki from
              your tagged documents.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create Knowledge Base
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {knowledgeBases.map((kb) => (
              <Link
                key={kb.id}
                href={`${prefix}/knowledge-bases/${kb.id}`}
                className="rounded-lg border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{kb.name}</p>
                    {kb.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {kb.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteId(kb.id);
                    }}
                    className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {kb.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-[10px]"
                      style={
                        tag.color
                          ? {
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                              borderColor: `${tag.color}40`,
                            }
                          : undefined
                      }
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {kb.status}
                  </span>
                </div>
                {kb.lastIngestedAt && (
                  <p className="text-[11px] text-muted-foreground">
                    Last ingested:{" "}
                    {new Date(kb.lastIngestedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setCreateOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Knowledge Base</DialogTitle>
            <DialogDescription>
              Select one or more tags to bind this knowledge base to. Files with
              any of the selected tags will be source documents for the wiki.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Product Documentation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tags *</label>
              {!allTags || allTags.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tags available. Create a tag first.
                </p>
              ) : (
                <div className="rounded-md border p-3 space-y-1 max-h-40 overflow-y-auto">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm transition-colors",
                        tagIds.includes(tag.id)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color ?? "#888" }}
                      />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {tagIds.includes(tag.id) && (
                        <span className="text-xs">&#10003;</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Files with any of the selected tags will be source documents for
                this knowledge base.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Schema Prompt (Wiki Structure)
              </label>
              <Textarea
                value={schemaPrompt}
                onChange={(e) => setSchemaPrompt(e.target.value)}
                rows={4}
                placeholder="Instructions for how the wiki should be organized..."
              />
              <p className="text-xs text-muted-foreground">
                This prompt guides the AI on how to structure wiki pages when
                ingesting documents.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  name,
                  tagIds,
                  description: description || undefined,
                  schemaPrompt: schemaPrompt || undefined,
                })
              }
              disabled={!name || tagIds.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Base</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this knowledge base and all its
              conversations. Wiki files in storage will be preserved. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
