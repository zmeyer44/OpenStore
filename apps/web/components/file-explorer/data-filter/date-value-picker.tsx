"use client";

import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { isEqual } from "date-fns";
import type { DateRange } from "react-day-picker";

export function DateValuePicker({
  selectedValues,
  onChange,
}: {
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const selected = useMemo<DateRange | undefined>(() => {
    if (selectedValues.length === 0) return undefined;
    return {
      from: new Date(selectedValues[0] + "T00:00:00"),
      to:
        selectedValues.length > 1
          ? new Date(selectedValues[1] + "T00:00:00")
          : undefined,
    };
  }, [selectedValues]);

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) {
      onChange([]);
      return;
    }

    const from = formatDateString(range.from);

    if (!range.to || isEqual(range.from, range.to)) {
      onChange([from]);
    } else {
      const to = formatDateString(range.to);
      onChange([from, to]);
    }
  }

  return (
    <div className="p-1">
      <Calendar
        mode="range"
        defaultMonth={selected?.from}
        selected={selected}
        onSelect={handleSelect}
        numberOfMonths={1}
      />
    </div>
  );
}

function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
