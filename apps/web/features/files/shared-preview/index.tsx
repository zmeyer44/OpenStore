"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { PreviewArea } from "../file-viewer/components/preview-area";
import { getViewerType } from "../utils";

/**
 * Renders a document preview on public share/tracked-link pages. Fetches the
 * signed URL via the provided callback so it works for both share links and
 * tracked links; `onDownload` is omitted for view-only access.
 */
export function SharedFilePreview({
  file,
  fetchUrl,
  onDownload,
}: {
  file: { name: string; mimeType: string; size: number };
  fetchUrl: () => Promise<string>;
  onDownload?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchUrl()
      .then(async (url) => {
        if (cancelled) return;
        setPreviewUrl(url);

        const vt = getViewerType(file.mimeType, file.name);
        if (vt === "text" || vt === "markdown" || vt === "csv" || vt === "html") {
          const text = await fetch(url).then((r) => r.text());
          if (!cancelled) setTextContent(text);
        }
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // Parent remounts this component (via key) when the file changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border bg-muted/30 flex flex-col items-center justify-center min-h-[40vh] gap-2 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <PreviewArea
      viewerType={getViewerType(file.mimeType, file.name)}
      previewUrl={previewUrl}
      textContent={textContent}
      file={file}
      loading={loading}
      onDownload={onDownload}
    />
  );
}
