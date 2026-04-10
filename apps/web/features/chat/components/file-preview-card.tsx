"use client";

import { ChevronRight } from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

export interface FilePreviewData {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  snippet?: string | null;
  previewUrl?: string | null;
}

export function FilePreviewCard({
  file,
  onClick,
}: {
  file: FilePreviewData;
  onClick?: () => void;
}) {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <button
      onClick={onClick}
      className={cn(
        "group/card flex items-center gap-3 w-full max-w-md rounded-xl border border-border/50",
        "bg-background px-4 py-3 text-left shadow-sm",
        "hover:border-border hover:shadow-md transition-all",
      )}
    >
      {/* Thumbnail or icon */}
      <div className="size-10 shrink-0 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
        {isImage && file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.name}
            className="size-10 rounded-lg object-cover"
          />
        ) : (
          <FileIcon name={file.name} mimeType={file.mimeType} className="size-5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatBytes(file.size)}
        </p>
      </div>

      {/* Chevron */}
      <ChevronRight className="size-4 text-muted-foreground/50 group-hover/card:text-muted-foreground transition-colors shrink-0" />
    </button>
  );
}
