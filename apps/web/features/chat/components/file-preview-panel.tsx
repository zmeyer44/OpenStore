"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/file-icon";
import { PreviewArea } from "@/features/files/file-viewer/components/preview-area";
import { getViewerType } from "@/features/files/utils";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

interface FilePreviewPanelProps {
  fileId: string;
  workspaceSlug: string;
  onClose: () => void;
}

export function FilePreviewPanel({ fileId, workspaceSlug, onClose }: FilePreviewPanelProps) {
  const { data: file } = trpc.files.get.useQuery({ id: fileId });
  const getDownloadUrl = trpc.files.getDownloadUrl.useMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const viewerType = file ? getViewerType(file.mimeType, file.name) : "unsupported";

  // Load preview URL when file data is available
  useEffect(() => {
    if (!file) return;

    getDownloadUrl.mutate(
      { id: file.id },
      {
        onSuccess: async (data) => {
          setPreviewUrl(data.url);

          // For text-based files, fetch content
          if (
            viewerType === "text" ||
            viewerType === "markdown" ||
            viewerType === "csv"
          ) {
            try {
              const res = await fetch(data.url);
              const text = await res.text();
              setTextContent(text);
            } catch {
              // Ignore
            }
          }
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id]);

  const handleDownload = useCallback(() => {
    if (previewUrl && file) {
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = file.name;
      a.click();
    }
  }, [previewUrl, file]);

  const handleOpenFullPage = useCallback(() => {
    if (file) {
      window.open(`/w/${workspaceSlug}/file/${file.id}`, "_blank");
    }
  }, [file, workspaceSlug]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-l bg-background">
      {/* Header */}
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {file && (
            <FileIcon
              name={file.name}
              mimeType={file.mimeType}
              className="size-4 shrink-0"
            />
          )}
          <h2 className="text-sm font-medium text-foreground truncate">
            {file?.name ?? "Loading..."}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="size-8 p-0"
            title="Download"
          >
            <Download className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenFullPage}
            disabled={!file}
            className="size-8 p-0"
            title="Open full page"
          >
            <ExternalLink className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="size-8 p-0"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* File info bar */}
      {file && (
        <div className="flex items-center gap-3 border-b px-4 py-2 text-xs text-muted-foreground">
          <span>{formatBytes(Number(file.size))}</span>
          <span className="text-border">|</span>
          <span>{file.mimeType}</span>
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 overflow-auto p-4">
        {file ? (
          <PreviewArea
            viewerType={viewerType}
            previewUrl={previewUrl}
            textContent={textContent}
            file={{
              name: file.name,
              mimeType: file.mimeType,
              size: Number(file.size),
            }}
            loading={!previewUrl && viewerType !== "unsupported"}
            onDownload={handleDownload}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
