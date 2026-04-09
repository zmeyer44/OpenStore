"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 100;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(current);
        current = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        row.push(current);
        current = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
        if (char === "\r") i++;
      } else {
        current += char;
      }
    }
  }

  // last field
  row.push(current);
  if (row.length > 1 || row[0] !== "") rows.push(row);

  return rows;
}

type SortDir = "asc" | "desc" | null;

export function CsvPreview({
  content,
  name,
}: {
  content: string | null;
  name: string;
}) {
  const text = content ?? "";
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const allRows = useMemo(() => parseCSV(text), [text]);
  const headers = allRows[0] ?? [];
  const dataRows = useMemo(() => allRows.slice(1), [allRows]);

  const filtered = useMemo(() => {
    if (!search) return dataRows;
    const q = search.toLowerCase();
    return dataRows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q)),
    );
  }, [dataRows, search]);

  const sorted = useMemo(() => {
    if (sortCol === null || sortDir === null) return filtered;
    const col = sortCol;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aVal = a[col] ?? "";
      const bVal = b[col] ?? "";
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== "") {
        return (aNum - bNum) * dir;
      }
      return aVal.localeCompare(bVal) * dir;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(
    clampedPage * PAGE_SIZE,
    (clampedPage + 1) * PAGE_SIZE,
  );

  function handleSort(col: number) {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortCol(null);
        setSortDir(null);
      }
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  if (!text) {
    return (
      <div className="rounded-lg border bg-muted/30 flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-muted-foreground">Empty file</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-muted/50">
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {name}
        </span>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search rows..."
              className="h-7 w-48 rounded-md border bg-background pl-7 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {filtered.length.toLocaleString()}{" "}
            {filtered.length === 1 ? "row" : "rows"} &middot;{" "}
            {headers.length} {headers.length === 1 ? "col" : "cols"}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/70 border-b">
              <th className="text-muted-foreground/40 text-xs font-normal text-right px-3 py-2 border-r border-border/50 sticky left-0 bg-muted/70 w-[1%] whitespace-nowrap">
                #
              </th>
              {headers.map((header, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="text-left px-3 py-2 border-r border-border/50 last:border-r-0 font-medium text-xs cursor-pointer select-none hover:bg-muted transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {header}
                    {sortCol === i && sortDir === "asc" ? (
                      <ArrowUp className="size-3 text-foreground" />
                    ) : sortCol === i && sortDir === "desc" ? (
                      <ArrowDown className="size-3 text-foreground" />
                    ) : (
                      <ArrowUpDown className="size-3 text-muted-foreground/40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, rowIdx) => {
              const globalIdx = clampedPage * PAGE_SIZE + rowIdx;
              return (
                <tr
                  key={globalIdx}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <td className="text-muted-foreground/40 text-xs text-right px-3 py-1.5 border-r border-border/50 sticky left-0 bg-card tabular-nums whitespace-nowrap">
                    {globalIdx + 1}
                  </td>
                  {headers.map((_, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-3 py-1.5 border-r border-border/50 last:border-r-0 whitespace-nowrap max-w-[400px] truncate"
                      title={row[colIdx] ?? ""}
                    >
                      {row[colIdx] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <span className="tabular-nums">
            Showing {(clampedPage * PAGE_SIZE + 1).toLocaleString()}&ndash;
            {Math.min(
              (clampedPage + 1) * PAGE_SIZE,
              sorted.length,
            ).toLocaleString()}{" "}
            of {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              className={cn(
                "inline-flex items-center justify-center size-7 rounded-md border transition-colors",
                clampedPage === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-muted cursor-pointer",
              )}
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2 tabular-nums">
              {clampedPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              className={cn(
                "inline-flex items-center justify-center size-7 rounded-md border transition-colors",
                clampedPage >= totalPages - 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-muted cursor-pointer",
              )}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
