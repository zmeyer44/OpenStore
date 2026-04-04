"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Download, FileSearch } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn, formatBytes } from "@/lib/utils";
import { FileIcon } from "@/components/file-icon";

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-primary/20 text-primary rounded-xs px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const getDownloadUrl = trpc.files.getDownloadUrl.useMutation();

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Search query
  const { data: results = [], isLoading } = trpc.files.search.useQuery(
    { query: debouncedQuery },
    { enabled: open && debouncedQuery.length > 0 },
  );

  // Cmd/Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input on open, reset on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const el = resultsRef.current.children[selectedIndex] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    async (fileId: string) => {
      try {
        const result = await getDownloadUrl.mutateAsync({ id: fileId });
        window.open(result.url, "_blank");
      } catch {}
      setOpen(false);
    },
    [getDownloadUrl],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const result = results[selectedIndex];
        if (result) handleSelect(result.id);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [results, selectedIndex, handleSelect],
  );

  const hasSnippets = results.some(
    (r: { snippet?: string | null }) => r.snippet,
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center cursor-pointer"
      >
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <div className="w-44 pl-8 h-8 pr-3 py-1.5 text-[13px] bg-muted border border-border text-muted-foreground flex items-center justify-between rounded-md">
          <span>Search files...</span>
          <kbd className="text-[10px] font-mono text-muted-foreground border border-border bg-background px-1.5 py-0.5 rounded-sm">
            {"\u2318"}K
          </kbd>
        </div>
      </button>

      {/* Command palette overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative flex justify-center pt-[20vh]">
            <div
              className="w-full max-w-xl mx-4 bg-background border border-border rounded-lg overflow-hidden shadow-2xl"
              style={{ animation: "commandSearchIn 150ms ease" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search file names and contents..."
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <kbd
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-mono text-muted-foreground border border-border bg-muted px-1.5 py-0.5 cursor-pointer hover:bg-accent rounded-sm"
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={resultsRef}
                className="max-h-[380px] overflow-y-auto py-1"
              >
                {!debouncedQuery ? (
                  <div className="px-4 py-10 text-center">
                    <FileSearch className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Search across file names and contents
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="px-4 py-10 text-center">
                    <div className="size-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Searching...
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No results for &ldquo;{debouncedQuery}&rdquo;
                    </p>
                  </div>
                ) : (
                  <>
                    {hasSnippets && (
                      <div className="px-4 py-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                          Content matches
                        </span>
                      </div>
                    )}
                    {results.map((file, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <button
                          key={file.id}
                          className={cn(
                            "w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer",
                            isSelected ? "bg-accent" : "hover:bg-muted/50",
                          )}
                          onClick={() => handleSelect(file.id)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center size-8 shrink-0 rounded-md mt-0.5",
                              isSelected ? "bg-primary/10" : "bg-muted",
                            )}
                          >
                            <FileIcon
                              name={file.name}
                              mimeType={file.mimeType}
                              className={cn(
                                "size-4",
                                isSelected && "text-primary",
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                <HighlightedText
                                  text={file.name}
                                  query={debouncedQuery}
                                />
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                {formatBytes(file.size)}
                              </span>
                            </div>
                            {file.snippet && (
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2 font-mono">
                                <HighlightedText
                                  text={file.snippet}
                                  query={debouncedQuery}
                                />
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Download className="size-3.5 text-muted-foreground shrink-0 mt-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border flex items-center gap-4">
                <span className="text-[10px] font-mono text-muted-foreground">
                  <kbd className="border border-border bg-muted px-1 py-0.5 mr-1 rounded-sm">
                    {"↑↓"}
                  </kbd>
                  navigate
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  <kbd className="border border-border bg-muted px-1 py-0.5 mr-1 rounded-sm">
                    {"↵"}
                  </kbd>
                  open
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  <kbd className="border border-border bg-muted px-1 py-0.5 mr-1 rounded-sm">
                    esc
                  </kbd>
                  close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
