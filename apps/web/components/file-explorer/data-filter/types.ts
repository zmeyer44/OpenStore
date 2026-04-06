import type { LucideIcon } from "lucide-react";

export type FilterOption = {
  label: string;
  value: string;
  color?: string | null;
};

export type OptionFilterColumnDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  type: "option";
  options: FilterOption[];
};

export type DateFilterColumnDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  type: "date";
};

export type FilterColumnDef = OptionFilterColumnDef | DateFilterColumnDef;

export type ActiveFilters = Record<string, string[]>;
