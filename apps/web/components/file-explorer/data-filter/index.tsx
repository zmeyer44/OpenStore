"use client";

import { useMemo } from "react";
import { FilterSelector } from "./filter-selector";
import { ActiveFilter } from "./active-filter";
import { FilterActions } from "./filter-actions";
import type { ActiveFilters as ActiveFiltersType } from "./types";

export type {
  FilterColumnDef,
  OptionFilterColumnDef,
  DateFilterColumnDef,
  FilterOption,
  ActiveFilters,
} from "./types";

export function DataFilter({
  columns,
  activeFilters,
  onFilterChange,
  onClearAll,
}: {
  columns: import("./types").FilterColumnDef[];
  activeFilters: ActiveFiltersType;
  onFilterChange: (columnId: string, values: string[]) => void;
  onClearAll: () => void;
}) {
  const hasFilters = useMemo(
    () => Object.values(activeFilters).some((v) => v.length > 0),
    [activeFilters],
  );

  const activeColumns = useMemo(
    () => columns.filter((col) => (activeFilters[col.id]?.length ?? 0) > 0),
    [columns, activeFilters],
  );

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex flex-wrap gap-2 flex-1">
        <FilterSelector
          columns={columns}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />
        {activeColumns.map((col) => (
          <ActiveFilter
            key={col.id}
            column={col}
            values={activeFilters[col.id]}
            onValuesChange={(values) => onFilterChange(col.id, values)}
            onRemove={() => onFilterChange(col.id, [])}
          />
        ))}
      </div>
      <FilterActions hasFilters={hasFilters} onClearAll={onClearAll} />
    </div>
  );
}
