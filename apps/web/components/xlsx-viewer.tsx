"use client";

import { useEffect, useMemo, useState } from "react";
import { read, utils, type WorkBook } from "xlsx";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CsvPreview } from "@/features/files/file-viewer/components/csv-preview";

export function XlsxViewer({ url, name }: { url: string; name: string }) {
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setWorkbook(null);
    setError(null);
    setActiveSheet(0);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load file (${r.status})`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (!cancelled) setWorkbook(read(buf));
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const csv = useMemo(() => {
    if (!workbook) return null;
    const sheetName = workbook.SheetNames[activeSheet];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    return sheet ? utils.sheet_to_csv(sheet) : "";
  }, [workbook, activeSheet]);

  if (error) {
    return (
      <div className="rounded-lg border bg-muted/30 flex flex-col items-center justify-center min-h-[40vh] gap-2 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!workbook) {
    return (
      <div className="rounded-lg border bg-muted/30 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {workbook.SheetNames.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto shrink-0">
          {workbook.SheetNames.map((sheetName, i) => (
            <button
              key={sheetName}
              onClick={() => setActiveSheet(i)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs whitespace-nowrap cursor-pointer transition-colors",
                i === activeSheet
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <CsvPreview key={activeSheet} content={csv} name={name} />
      </div>
    </div>
  );
}
