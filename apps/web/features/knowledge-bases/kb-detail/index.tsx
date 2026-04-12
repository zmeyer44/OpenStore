"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRuntime } from "@/hooks/use-runtime";
import { ChatPanel } from "./components/chat-panel";
import { WikiBrowser } from "./components/wiki-browser";
import { SourceList } from "./components/source-list";
import { KBSettings } from "./components/kb-settings";
import { LintResults, type LintResult } from "./components/lint-results";

export function KBDetailPage({ id }: { id: string }) {
  const workspace = useWorkspace();
  const prefix = `/w/${workspace.slug}`;
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();
  const { data: capabilities } = useRuntime();

  // Initialize from URL search params, then manage with React state
  const [activeTab, setActiveTabState] = useState(
    () => searchParams.get("tab") ?? "chat",
  );
  const [wikiPage, setWikiPage] = useState<string | null>(
    () => searchParams.get("page") ?? null,
  );

  // Update URL without triggering Next.js navigation
  const updateUrl = useCallback(
    (tab: string, page?: string | null) => {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      if (page) params.set("page", page);
      else params.delete("page");
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    },
    [],
  );

  const setActiveTab = useCallback(
    (tab: string) => {
      setActiveTabState(tab);
      updateUrl(tab, tab === "wiki" ? wikiPage : null);
    },
    [updateUrl, wikiPage],
  );

  const navigateToWikiPage = useCallback(
    (pagePath: string) => {
      setWikiPage(pagePath);
      setActiveTabState("wiki");
      updateUrl("wiki", pagePath);
    },
    [updateUrl],
  );

  const { data: kb, isLoading } = trpc.knowledgeBases.get.useQuery(
    { id },
    { refetchInterval: (query) => query.state.data?.status === "building" ? 3000 : false },
  );
  const [lintResults, setLintResults] = useState<LintResult | null>(null);

  // Detect when KB finishes building so we can refresh wiki pages + notify
  const prevStatus = useRef(kb?.status);
  useEffect(() => {
    if (prevStatus.current === "building" && kb?.status === "active") {
      utils.knowledgeBases.wikiPages.invalidate({ knowledgeBaseId: id });
      toast.success("Knowledge base build complete");
    }
    if (prevStatus.current === "building" && kb?.status === "error") {
      toast.error("Knowledge base build failed");
    }
    prevStatus.current = kb?.status;
  }, [kb?.status, id, utils]);

  const isBuilding = kb?.status === "building";

  const ingestAllMutation = trpc.knowledgeBases.ingestAll.useMutation({
    onSuccess: (result) => {
      utils.knowledgeBases.get.invalidate({ id });
      toast.info(`Building knowledge base from ${result.totalFiles} files...`);
    },
    onError: (error) => toast.error(error.message),
  });

  const lintMutation = trpc.knowledgeBases.lint.useMutation({
    onSuccess: (result) => {
      setLintResults(result);
      utils.knowledgeBases.get.invalidate({ id });
      toast.success(`Lint complete: ${result.issues.length} issues found`);
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Knowledge base not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Link
          href={`${prefix}/knowledge-bases`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <BookOpen className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate">{kb.name}</span>
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

        <div className="flex-1" />

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            ingestAllMutation.mutate({ knowledgeBaseId: id })
          }
          disabled={ingestAllMutation.isPending || isBuilding || !capabilities?.longRunningSupported}
          title={capabilities && !capabilities.longRunningSupported ? "Bulk ingestion is not available on serverless runtimes" : undefined}
        >
          {ingestAllMutation.isPending || isBuilding ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {isBuilding ? "Building..." : "Ingest All"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => lintMutation.mutate({ knowledgeBaseId: id })}
          disabled={lintMutation.isPending}
        >
          {lintMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Search className="size-3.5" />
          )}
          Lint
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="border-b px-4">
            <TabsList className="h-10 bg-transparent p-0 gap-4">
              <TabsTrigger
                value="chat"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="wiki"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Wiki
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Sources
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
            <ChatPanel
              knowledgeBaseId={id}
              onNavigateToPage={navigateToWikiPage}
            />
          </TabsContent>
          <TabsContent value="wiki" className="flex-1 overflow-hidden mt-0">
            <WikiBrowser knowledgeBaseId={id} initialPage={wikiPage} />
          </TabsContent>
          <TabsContent value="sources" className="flex-1 overflow-auto mt-0">
            <SourceList knowledgeBaseId={id} />
          </TabsContent>
          <TabsContent
            value="settings"
            className="flex-1 overflow-auto mt-0"
          >
            <KBSettings knowledgeBaseId={id} />
          </TabsContent>
        </Tabs>
      </div>

      {lintResults && lintResults.issues.length > 0 && (
        <LintResults
          results={lintResults}
          onClose={() => setLintResults(null)}
          onNavigateToPage={(pagePath) => {
            navigateToWikiPage(pagePath);
          }}
        />
      )}
    </div>
  );
}
