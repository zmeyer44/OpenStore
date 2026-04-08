"use client";

import { FileText, Upload, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SourceList({
  knowledgeBaseId,
}: {
  knowledgeBaseId: string;
}) {
  const utils = trpc.useUtils();

  const { data: sources, isLoading } = trpc.knowledgeBases.sources.useQuery({
    knowledgeBaseId,
  });

  const ingestMutation = trpc.knowledgeBases.ingest.useMutation({
    onSuccess: (result) => {
      utils.knowledgeBases.wikiPages.invalidate({ knowledgeBaseId });
      utils.knowledgeBases.sources.invalidate({ knowledgeBaseId });
      utils.knowledgeBases.get.invalidate({ id: knowledgeBaseId });
      toast.success(result.message);
    },
    onError: (error) => toast.error(error.message),
  });

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatRelativeTime(date: Date | string): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h3 className="text-sm font-medium mb-3">Source Documents</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Files tagged with the knowledge base tag. Click "Ingest" to extract
        knowledge from a file into the wiki.
      </p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading sources...</div>
      ) : !sources || sources.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          No source documents found. Tag files with the knowledge base tag to
          add them as sources.
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.mimeType} &middot; {formatSize(file.size)}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs shrink-0",
                  file.ingestedAt
                    ? "text-muted-foreground"
                    : "text-amber-500",
                )}
              >
                {file.ingestedAt ? (
                  <span className="flex items-center gap-1">
                    <Check className="size-3" />
                    Ingested {formatRelativeTime(file.ingestedAt)}
                  </span>
                ) : (
                  "Not ingested"
                )}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  ingestMutation.mutate({
                    knowledgeBaseId,
                    fileId: file.id,
                  })
                }
                disabled={
                  ingestMutation.isPending &&
                  ingestMutation.variables?.fileId === file.id
                }
              >
                {ingestMutation.isPending &&
                ingestMutation.variables?.fileId === file.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                Ingest
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
