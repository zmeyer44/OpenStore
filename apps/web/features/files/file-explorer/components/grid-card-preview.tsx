"use client";

import { useRef, useEffect, useState, memo } from "react";
import { cn, getFileExtension } from "@/lib/utils";
import { FileIcon } from "@/components/file-icon";
import { trpc } from "@/lib/trpc/client";
import { getFileCategory, isTextIndexable } from "@locker/common";
import { CODE_EXTENSIONS } from "../../utils";

/* ------------------------------------------------------------------ */
/*  PDF first-page thumbnail (canvas-based, like PDFThumbnail)         */
/* ------------------------------------------------------------------ */

const PdfThumbnail = memo(function PdfThumbnail({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const pdfjs = await import("pdfjs-dist");
      if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }

      try {
        const doc = await pdfjs.getDocument({ url, withCredentials: false })
          .promise;
        if (cancelled) {
          doc.destroy();
          return;
        }

        const page = await doc.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        if (!container) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = container.clientWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.scale(outputScale, outputScale);
        await page.render({ canvas, viewport }).promise;
        if (!cancelled) setReady(true);

        doc.destroy();
      } catch {
        /* silent fail — icon fallback will show */
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 w-full object-cover object-top transition-opacity duration-300",
        ready ? "opacity-100" : "opacity-0",
      )}
    />
  );
});

/* ------------------------------------------------------------------ */
/*  Text document thumbnail (miniature page preview)                   */
/* ------------------------------------------------------------------ */

const TextThumbnail = memo(function TextThumbnail({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setReady(true);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!content) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-300",
        ready ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="origin-top-left w-[400%] h-[400%] scale-[0.25] bg-white dark:bg-zinc-900 p-6 overflow-hidden">
        <pre className="text-xs leading-[1.6] font-[system-ui,sans-serif] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
          {content.slice(0, 3000)}
        </pre>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  DOCX document thumbnail (docx-preview first-page render)           */
/* ------------------------------------------------------------------ */

const DocxThumbnail = memo(function DocxThumbnail({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        if (cancelled) return;

        const { renderAsync } = await import("docx-preview");

        // Render into a hidden off-screen container to get the first page
        const offscreen = document.createElement("div");
        offscreen.style.position = "absolute";
        offscreen.style.left = "-9999px";
        offscreen.style.top = "0";
        document.body.appendChild(offscreen);

        const styleEl = document.createElement("div");
        offscreen.appendChild(styleEl);

        await renderAsync(blob, offscreen, styleEl, {
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          inWrapper: true,
          className: "docx-thumb",
          ignoreFonts: false,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: false,
          renderEndnotes: false,
        });

        if (cancelled) {
          document.body.removeChild(offscreen);
          return;
        }

        // Grab the first page section
        const firstPage = offscreen.querySelector<HTMLElement>(
          "section.docx-thumb",
        );

        if (firstPage && container) {
          const pageWidth = firstPage.offsetWidth || 816;
          const pageHeight = firstPage.offsetHeight || 1056;
          const clone = firstPage.cloneNode(true) as HTMLElement;

          // Also grab and clone the style element so formatting is preserved
          const styles = offscreen.querySelectorAll("style");
          const styleClones = Array.from(styles).map((s) =>
            s.cloneNode(true),
          );

          const scale = container.clientWidth / pageWidth;
          clone.style.transform = `scale(${scale})`;
          clone.style.transformOrigin = "top left";
          clone.style.position = "absolute";
          clone.style.top = "0";
          clone.style.left = "0";

          container.style.height = `${pageHeight * scale}px`;
          container.innerHTML = "";
          for (const s of styleClones) container.appendChild(s);
          container.appendChild(clone);

          setReady(true);
        }

        document.body.removeChild(offscreen);
      } catch {
        /* silent fail — icon fallback will show */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden transition-opacity duration-300",
        ready ? "opacity-100" : "opacity-0",
      )}
    />
  );
});

/* ------------------------------------------------------------------ */
/*  Main preview component                                             */
/* ------------------------------------------------------------------ */

export function GridCardPreview({
  fileId,
  fileName,
  mimeType,
}: {
  fileId: string;
  fileName: string;
  mimeType: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const fetchedRef = useRef(false);

  const getDownloadUrl = trpc.files.getDownloadUrl.useMutation();
  const category = getFileCategory(mimeType);
  const isPdf = mimeType === "application/pdf";
  const isImage = category === "image";
  const isVideo = category === "video";
  const ext = getFileExtension(fileName);
  const isDocx =
    ext === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isText =
    !isPdf &&
    !isDocx &&
    (mimeType.startsWith("text/") ||
      isTextIndexable(mimeType) ||
      CODE_EXTENSIONS.has(ext));
  const hasPreview = isImage || isPdf || isVideo || isText || isDocx;

  // Observe visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsVisible(true);
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch URL when visible (only for previewable types)
  useEffect(() => {
    if (!isVisible || !hasPreview || fetchedRef.current) return;
    fetchedRef.current = true;

    getDownloadUrl
      .mutateAsync({ id: fileId })
      .then((result) => setUrl(result.url))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, hasPreview, fileId]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
    >
      {/* Fallback icon — always present, fades out when preview loads */}
      <FileIcon
        name={fileName}
        mimeType={mimeType}
        className={cn(
          "size-10 opacity-30 transition-opacity duration-300",
          (imgLoaded || (isPdf && url) || (isDocx && url) || (isText && url)) &&
            "opacity-0",
        )}
      />

      {/* Image preview */}
      {isImage && url && (
        <img
          src={url}
          alt={fileName}
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* PDF first-page preview */}
      {isPdf && url && <PdfThumbnail url={url} />}

      {/* DOCX document preview */}
      {isDocx && url && <DocxThumbnail url={url} />}

      {/* Text document preview */}
      {isText && url && <TextThumbnail url={url} />}

      {/* Video poster frame */}
      {isVideo && url && (
        <video
          src={url}
          muted
          preload="metadata"
          onLoadedData={(e) => {
            const video = e.currentTarget;
            video.currentTime = 0.1;
            setImgLoaded(true);
          }}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
