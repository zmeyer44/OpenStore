"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ListFilter, ChevronLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterValuePicker } from "./filter-value-picker";
import { DateValuePicker } from "./date-value-picker";
import type { FilterColumnDef, ActiveFilters } from "./types";

export function FilterSelector({
  columns,
  activeFilters,
  onFilterChange,
}: {
  columns: FilterColumnDef[];
  activeFilters: ActiveFilters;
  onFilterChange: (columnId: string, values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [columnSearch, setColumnSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedColumnId(null);
      setColumnSearch("");
    }
  }, [open]);

  const selectedColumn = selectedColumnId
    ? columns.find((c) => c.id === selectedColumnId)
    : null;

  const filteredColumns = useMemo(() => {
    if (!columnSearch) return columns;
    const q = columnSearch.toLowerCase();
    return columns.filter((c) => c.label.toLowerCase().includes(q));
  }, [columns, columnSearch]);

  const handleToggle = useCallback(
    (columnId: string, value: string) => {
      const current = activeFilters[columnId] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFilterChange(columnId, next);
    },
    [activeFilters, onFilterChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter className="size-3" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={selectedColumn?.type === "date" ? "w-auto" : undefined}
      >
        {selectedColumn ? (
          <div>
            <button
              onClick={() => setSelectedColumnId(null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-3" />
              {selectedColumn.label}
            </button>
            <div className="h-px bg-border/50" />
            {selectedColumn.type === "date" ? (
              <DateValuePicker
                selectedValues={activeFilters[selectedColumn.id] ?? []}
                onChange={(values) =>
                  onFilterChange(selectedColumn.id, values)
                }
              />
            ) : (
              <FilterValuePicker
                options={selectedColumn.options}
                selectedValues={activeFilters[selectedColumn.id] ?? []}
                onToggle={(value) => handleToggle(selectedColumn.id, value)}
                placeholder={`Search ${selectedColumn.label.toLowerCase()}...`}
              />
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 px-3 py-2 pt-3">
              <Search className="size-3.5 text-muted-foreground shrink-0" />
              <input
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Search filters..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="h-px bg-border/50" />
            <div className="p-1.5">
              {filteredColumns.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No filters found
                </div>
              ) : (
                filteredColumns.map((col) => {
                  const Icon = col.icon;
                  const count = activeFilters[col.id]?.length ?? 0;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColumnId(col.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none hover:bg-accent transition-colors"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{col.label}</span>
                      {count > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
