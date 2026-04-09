"use client";

import type React from "react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize,
  Minus,
  Plus,
  RotateCcw,
  PanelLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const THUMBNAIL_WIDTH = 120;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DocxViewerProps {
  url: string;
  className?: string;
  showThumbnails?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Icon button helper                                                 */
/* ------------------------------------------------------------------ */

function ToolbarButton({
  icon,
  tooltip,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClick}
          disabled={disabled}
          className={cn(active && "bg-muted text-foreground")}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Thumbnail                                                          */
/* ------------------------------------------------------------------ */

const DocxThumbnail = memo(function DocxThumbnail({
  pageEl,
  styleEls,
  pageNumber,
  isActive,
  onClick,
}: {
  pageEl: HTMLElement;
  styleEls: HTMLElement[];
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clone the page element rendered by docx-preview for the thumbnail
    const clone = pageEl.cloneNode(true) as HTMLElement;

    // Measure the original page to compute scale
    const pageWidth = pageEl.offsetWidth || 816;
    const pageHeight = pageEl.offsetHeight || 1056;
    const scale = THUMBNAIL_WIDTH / pageWidth;

    // Create a shadow DOM to scope the docx styles to just this thumbnail
    const wrapper = document.createElement("div");
    wrapper.style.width = `${pageWidth}px`;
    wrapper.style.height = `${pageHeight}px`;
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = "top left";
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.overflow = "hidden";

    // Clone styles so they apply within the thumbnail
    for (const styleEl of styleEls) {
      wrapper.appendChild(styleEl.cloneNode(true));
    }
    wrapper.appendChild(clone);

    container.style.width = `${THUMBNAIL_WIDTH}px`;
    container.style.height = `${pageHeight * scale}px`;

    container.innerHTML = "";
    container.appendChild(wrapper);
    setReady(true);
  }, [pageEl, styleEls]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all duration-150",
        "hover:bg-muted/60",
        isActive && "bg-muted",
      )}
    >
      <div
        className={cn(
          "relative rounded overflow-hidden transition-all duration-150",
          "ring-2 ring-offset-2 ring-offset-background",
          isActive
            ? "ring-primary shadow-md"
            : "ring-transparent hover:ring-muted-foreground/20",
          ready ? "opacity-100" : "opacity-0",
        )}
      >
        <div ref={containerRef} className="relative overflow-hidden" />
      </div>
      <span
        className={cn(
          "text-xs tabular-nums transition-colors",
          isActive ? "text-foreground font-medium" : "text-muted-foreground",
        )}
      >
        {pageNumber}
      </span>
    </button>
  );
});

/* ------------------------------------------------------------------ */
/*  Toolbar                                                            */
/* ------------------------------------------------------------------ */

function DocxToolbar({
  currentPage,
  totalPages,
  scale,
  showThumbnails,
  onPageChange,
  onScaleChange,
  onToggleThumbnails,
  onFitWidth,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  scale: number;
  showThumbnails: boolean;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onToggleThumbnails: () => void;
  onFitWidth: () => void;
  isLoading: boolean;
}) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (
    e: React.FormEvent | React.FocusEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const page = Number.parseInt(pageInput, 10);
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5",
        "border-b bg-background/95 backdrop-blur-sm",
        "supports-[backdrop-filter]:bg-background/80",
        "shrink-0 z-10",
      )}
    >
      {/* Left — Thumbnail toggle */}
      <div className="flex items-center">
        <ToolbarButton
          icon={<PanelLeft className="size-4" />}
          tooltip={showThumbnails ? "Hide pages" : "Show pages"}
          onClick={onToggleThumbnails}
          active={showThumbnails}
        />
      </div>

      {/* Center — Page navigation */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ChevronLeft className="size-4" />}
          tooltip="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        />

        <form
          onSubmit={handlePageInputSubmit}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageInputSubmit}
            className={cn(
              "w-10 h-7 text-center text-sm tabular-nums rounded-md",
              "border border-border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "transition-shadow",
            )}
            disabled={isLoading}
          />
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm tabular-nums text-muted-foreground min-w-[2ch]">
            {totalPages}
          </span>
        </form>

        <ToolbarButton
          icon={<ChevronRight className="size-4" />}
          tooltip="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        />
      </div>

      {/* Right — Zoom controls */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Minus className="size-4" />}
          tooltip="Zoom out"
          onClick={() => onScaleChange(Math.max(MIN_SCALE, scale - SCALE_STEP))}
          disabled={scale <= MIN_SCALE || isLoading}
        />

        <div
          className={cn(
            "flex items-center justify-center",
            "min-w-[52px] h-7 px-2",
            "text-sm tabular-nums text-muted-foreground",
            "rounded-md bg-muted/50",
          )}
        >
          {zoomPercentage}%
        </div>

        <ToolbarButton
          icon={<Plus className="size-4" />}
          tooltip="Zoom in"
          onClick={() => onScaleChange(Math.min(MAX_SCALE, scale + SCALE_STEP))}
          disabled={scale >= MAX_SCALE || isLoading}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          icon={<Maximize className="size-4" />}
          tooltip="Fit to width"
          onClick={onFitWidth}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main viewer                                                        */
/* ------------------------------------------------------------------ */

export function DocxViewer({
  url,
  className,
  showThumbnails: initialShowThumbnails = true,
}: DocxViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const styleContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageElements, setPageElements] = useState<HTMLElement[]>([]);
  const [styleElements, setStyleElements] = useState<HTMLElement[]>([]);
  const [scale, setScale] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(initialShowThumbnails);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState(816);

  const totalPages = pageElements.length || 1;

  /* ---- Load and render document ---- */
  useEffect(() => {
    const docxContainer = docxContainerRef.current;
    const styleContainer = styleContainerRef.current;
    if (!docxContainer || !styleContainer) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        if (cancelled) return;

        const { renderAsync } = await import("docx-preview");

        await renderAsync(blob, docxContainer, styleContainer, {
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          inWrapper: true,
          className: "docx-viewer",
          ignoreFonts: false,
          ignoreWidth: false,
          ignoreHeight: false,
          useBase64URL: true,
        });

        if (cancelled) return;

        // docx-preview wraps pages in a div.docx-viewer-wrapper > section.docx-viewer
        const pages = Array.from(
          docxContainer.querySelectorAll<HTMLElement>("section.docx-viewer"),
        );

        // Capture style elements for thumbnails
        const styles = Array.from(
          styleContainer.querySelectorAll<HTMLElement>("style"),
        );

        if (pages.length > 0) {
          setPageElements(pages);
          setStyleElements(styles);
          setPageWidth(pages[0]!.offsetWidth);
        }

        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load document",
          );
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  /* ---- Observe container width ---- */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /* ---- Effective scale (auto-fit to container width) ---- */
  const fitScale =
    containerWidth > 0 ? Math.min(1, (containerWidth - 48) / pageWidth) : 1;
  const effectiveScale = scale * fitScale;

  /* ---- Apply zoom via CSS transform on the docx container ---- */
  useEffect(() => {
    const el = docxContainerRef.current;
    if (!el) return;

    el.style.transform = `scale(${effectiveScale})`;
    el.style.transformOrigin = "top center";
  }, [effectiveScale]);

  /* ---- Track visible page via IntersectionObserver ---- */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || pageElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const mostVisible = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev,
          );
          const idx = pageElements.indexOf(mostVisible.target as HTMLElement);
          if (idx >= 0) {
            setCurrentPage(idx + 1);
          }
        }
      },
      {
        root: scrollContainer,
        rootMargin: "0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of pageElements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pageElements]);

  /* ---- Scroll to page ---- */
  const scrollToPage = useCallback(
    (pageNumber: number) => {
      const el = pageElements[pageNumber - 1];
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [pageElements],
  );

  /* ---- Page change handler ---- */
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        scrollToPage(page);
      }
    },
    [totalPages, scrollToPage],
  );

  /* ---- Scale handlers ---- */
  const handleScaleChange = useCallback((s: number) => {
    setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, s)));
  }, []);

  const handleFitWidth = useCallback(() => {
    setScale(1);
  }, []);

  /* ---- Keyboard navigation ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (isLoading) return;
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          if (e.ctrlKey || e.metaKey) handlePageChange(1);
          else handlePageChange(currentPage - 1);
          e.preventDefault();
          break;
        case "ArrowRight":
        case "ArrowDown":
          if (e.ctrlKey || e.metaKey) handlePageChange(totalPages);
          else handlePageChange(currentPage + 1);
          e.preventDefault();
          break;
        case "Home":
          handlePageChange(1);
          e.preventDefault();
          break;
        case "End":
          handlePageChange(totalPages);
          e.preventDefault();
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            handleScaleChange(scale + SCALE_STEP);
            e.preventDefault();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            handleScaleChange(scale - SCALE_STEP);
            e.preventDefault();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            setScale(1);
            e.preventDefault();
          }
          break;
      }
    },
    [
      isLoading,
      currentPage,
      totalPages,
      scale,
      handlePageChange,
      handleScaleChange,
    ],
  );

  /* ---- Error state ---- */
  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col h-full rounded-lg overflow-hidden",
          "bg-muted/30 border",
          className,
        )}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <div className="p-3 rounded-full bg-destructive/10">
              <RotateCcw className="size-6 text-destructive" />
            </div>
            <div>
              <p className="font-medium">Failed to load document</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-lg overflow-hidden",
        "bg-muted/30 border",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="document"
      aria-label="Word Document Viewer"
    >
      {/* Toolbar */}
      <DocxToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        showThumbnails={showThumbnails}
        onPageChange={handlePageChange}
        onScaleChange={handleScaleChange}
        onToggleThumbnails={() => setShowThumbnails(!showThumbnails)}
        onFitWidth={handleFitWidth}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Thumbnail sidebar */}
        {showThumbnails && pageElements.length > 0 && (
          <div
            className={cn(
              "w-40 border-r bg-background/50",
              "flex flex-col overflow-hidden",
              "transition-all duration-200",
            )}
          >
            <div className="p-2 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pages
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pageElements.map((el, i) => (
                <DocxThumbnail
                  key={i}
                  pageEl={el}
                  styleEls={styleElements}
                  pageNumber={i + 1}
                  isActive={currentPage === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Document render area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative bg-muted/50"
        >
          {/* Loading overlay — shown while rendering, but container stays mounted */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading document...
                </p>
              </div>
            </div>
          )}

          {/* Container for docx-preview injected styles */}
          <div ref={styleContainerRef} />

          {/* docx-preview renders pages into this container */}
          <div className="flex justify-center py-4 min-h-full">
            <div
              ref={docxContainerRef}
              className={cn(
                "docx-viewer-container",
                "[&_section.docx-viewer]:bg-white [&_section.docx-viewer]:dark:bg-zinc-900",
                "[&_section.docx-viewer]:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]",
                "[&_section.docx-viewer]:rounded-sm",
                "[&_section.docx-viewer]:mb-4",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
