"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileText, Loader2, Pencil, Eye, Save, X, List, Network } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { WikiGraph } from "./wiki-graph";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function WikiBrowser({
  knowledgeBaseId,
  initialPage,
}: {
  knowledgeBaseId: string;
  initialPage?: string | null;
}) {
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (initialPage) setSelectedPage(initialPage);
  }, [initialPage]);

  const { data: pages, isLoading: pagesLoading } =
    trpc.knowledgeBases.wikiPages.useQuery({ knowledgeBaseId });

  const { data: pageData, isLoading: pageLoading } =
    trpc.knowledgeBases.wikiPage.useQuery(
      { knowledgeBaseId, pagePath: selectedPage! },
      { enabled: !!selectedPage },
    );

  const saveMutation = trpc.knowledgeBases.updateWikiPage.useMutation({
    onSuccess: () => {
      utils.knowledgeBases.wikiPage.invalidate({
        knowledgeBaseId,
        pagePath: selectedPage!,
      });
      setEditing(false);
      toast.success("Page saved");
    },
    onError: (error) => toast.error(error.message),
  });

  function handleEdit() {
    if (!pageData) return;
    setDraft(pageData.content);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setDraft("");
  }

  function handleSave() {
    if (!selectedPage) return;
    saveMutation.mutate({
      knowledgeBaseId,
      pagePath: selectedPage,
      content: draft,
    });
  }

  // Exit edit mode when switching pages
  function handleSelectPage(path: string) {
    setEditing(false);
    setDraft("");
    setSelectedPage(path);
    setViewMode("list");
  }

  // Custom renderer for wiki links [[page-slug]]
  const renderContent = (content: string) => {
    return content.replace(
      /\[\[([^\]]+)\]\]/g,
      (_, slug) => `[${slug}](wiki://${slug})`,
    );
  };

  if (viewMode === "graph") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">
            Graph View
          </span>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setViewMode("list")}
          >
            <List className="size-3" />
            List
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <WikiGraph
            knowledgeBaseId={knowledgeBaseId}
            onSelectPage={handleSelectPage}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Page list sidebar */}
      <div className="w-56 border-r shrink-0">
        <div className="flex items-center gap-2 p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">
            Pages
          </p>
          <button
            onClick={() => setViewMode("graph")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Graph view"
          >
            <Network className="size-3.5" />
          </button>
        </div>
        <ScrollArea className="h-[calc(100%-41px)]">
          {pagesLoading ? (
            <div className="p-3 text-xs text-muted-foreground">Loading...</div>
          ) : !pages || pages.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">
              No wiki pages yet. Ingest some source documents to create pages.
            </div>
          ) : (
            <div className="p-1">
              {pages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => handleSelectPage(page.path)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded text-sm truncate transition-colors",
                    selectedPage === page.path
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <FileText className="size-3 inline mr-1.5 -mt-0.5" />
                  {page.title}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Page content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        {selectedPage && pageData && (
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <span className="text-xs text-muted-foreground truncate flex-1">
              {selectedPage}
            </span>
            {editing ? (
              <>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={saveMutation.isPending}
                >
                  <X className="size-3" />
                  Cancel
                </Button>
                <Button
                  size="xs"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <Button size="xs" variant="outline" onClick={handleEdit}>
                <Pencil className="size-3" />
                Edit
              </Button>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {!selectedPage ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a page to view its content.
            </div>
          ) : pageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : pageData ? (
            editing ? (
              <div className="h-full" data-color-mode="light">
                <MDEditor
                  value={draft}
                  onChange={(val) => setDraft(val ?? "")}
                  height="100%"
                  preview="edit"
                  visibleDragbar={false}
                  hideToolbar
                />
              </div>
            ) : (
              <div className="p-6 md:px-10 md:py-8 prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-img:rounded-lg">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  urlTransform={(url) => url}
                  components={{
                    a: ({ href, children, ...props }) => {
                      if (href?.startsWith("wiki://")) {
                        const slug = href.replace("wiki://", "");
                        const targetPath = slug.endsWith(".md")
                          ? slug
                          : `${slug}.md`;
                        return (
                          <button
                            onClick={() => handleSelectPage(targetPath)}
                            className="text-primary underline cursor-pointer hover:text-primary/80"
                          >
                            {children}
                          </button>
                        );
                      }
                      return (
                        <a href={href} {...props}>
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {renderContent(pageData.content)}
                </ReactMarkdown>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Page not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
