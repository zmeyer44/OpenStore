import { Loader2 } from "lucide-react";
import type { ViewerType } from "../types";
import { ImagePreview } from "./image-preview";
import { VideoPreview } from "./video-preview";
import { AudioPreview } from "./audio-preview";
import { PdfPreview } from "./pdf-preview";
import { DocxPreview } from "./docx-preview";
import { MarkdownPreview } from "./markdown-preview";
import { TextPreview } from "./text-preview";
import { CsvPreview } from "./csv-preview";
import { UnsupportedPreview } from "./unsupported-preview";

export function PreviewArea({
  viewerType,
  previewUrl,
  textContent,
  file,
  loading,
  onDownload,
}: {
  viewerType: ViewerType;
  previewUrl: string | null;
  textContent: string | null;
  file: { name: string; mimeType: string; size: number };
  loading: boolean;
  onDownload: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-muted/30 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  switch (viewerType) {
    case "image":
      return <ImagePreview url={previewUrl} name={file.name} />;
    case "video":
      return <VideoPreview url={previewUrl} />;
    case "audio":
      return <AudioPreview url={previewUrl} file={file} />;
    case "pdf":
      return <PdfPreview url={previewUrl} />;
    case "docx":
      return <DocxPreview url={previewUrl} />;
    case "markdown":
      return <MarkdownPreview content={textContent} name={file.name} />;
    case "csv":
      return <CsvPreview content={textContent} name={file.name} />;
    case "text":
      return <TextPreview content={textContent} name={file.name} />;
    case "unsupported":
      return <UnsupportedPreview file={file} onDownload={onDownload} />;
  }
}
