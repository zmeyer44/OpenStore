"use client";

import { useMemo, useCallback } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FilterValuePicker } from "./filter-value-picker";
import { DateValuePicker } from "./date-value-picker";
import type { FilterColumnDef } from "./types";

export function ActiveFilter({
  column,
  values,
  onValuesChange,
  onRemove,
}: {
  column: FilterColumnDef;
  values: string[];
  onValuesChange: (values: string[]) => void;
  onRemove: () => void;
}) {
  const Icon = column.icon;

  const displayText = useMemo(() => {
    if (values.length === 0) return "None";

    if (column.type === "date") {
      if (values.length === 1) {
        return format(new Date(values[0] + "T00:00:00"), "MMM d, yyyy");
      }
      const from = format(new Date(values[0] + "T00:00:00"), "MMM d");
      const to = format(new Date(values[1] + "T00:00:00"), "MMM d, yyyy");
      return `${from} – ${to}`;
    }

    const selectedOptions = column.options.filter((o) =>
      values.includes(o.value),
    );
    if (selectedOptions.length <= 2) {
      return selectedOptions.map((o) => o.label).join(", ");
    }
    return `${selectedOptions.length} selected`;
  }, [column, values]);

  const handleToggle = useCallback(
    (value: string) => {
      const next = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
      onValuesChange(next);
    },
    [values, onValuesChange],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-4xl border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted">
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{column.label}</span>
          <Separator orientation="vertical" className="mx-0.5 h-4" />
          <span className="max-w-40 truncate">{displayText}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
          >
            <X className="size-3" />
          </button>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={column.type === "date" ? "w-auto" : undefined}
      >
        {column.type === "date" ? (
          <DateValuePicker
            selectedValues={values}
            onChange={onValuesChange}
          />
        ) : (
          <FilterValuePicker
            options={column.options}
            selectedValues={values}
            onToggle={handleToggle}
            placeholder={`Search ${column.label.toLowerCase()}...`}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
