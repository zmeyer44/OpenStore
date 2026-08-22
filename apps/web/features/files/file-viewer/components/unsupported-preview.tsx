import { Download } from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

export function UnsupportedPreview({
  file,
  onDownload,
}: {
  file: { name: string; mimeType: string; size: number };
  onDownload?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
      <div className="size-20 rounded-2xl bg-muted flex items-center justify-center">
        <FileIcon
          name={file.name}
          mimeType={file.mimeType}
          className="size-9"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{file.name}</p>
        <p className="text-sm text-muted-foreground">
          Preview is not available for this file type
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatBytes(file.size)}
        </p>
      </div>
      {onDownload && (
        <Button size="sm" onClick={onDownload}>
          <Download className="size-4" />
          Download to view
        </Button>
      )}
    </div>
  );
}
