"use client";

import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface LintIssue {
  type: "contradiction" | "orphan" | "stale" | "missing_link";
  page: string;
  description: string;
  severity: "info" | "warning" | "error";
}

export interface LintResult {
  issues: LintIssue[];
  summary: string;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
} as const;

export function LintResults({
  results,
  onClose,
  onNavigateToPage,
}: {
  results: LintResult;
  onClose: () => void;
  onNavigateToPage: (pagePath: string) => void;
}) {
  const grouped = {
    error: results.issues.filter((i) => i.severity === "error"),
    warning: results.issues.filter((i) => i.severity === "warning"),
    info: results.issues.filter((i) => i.severity === "info"),
  };

  return (
    <div className="border-t bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          <span className="text-sm font-medium">
            Lint Results ({results.issues.length} issues)
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-48">
        <div className="p-3 space-y-1">
          {results.summary && (
            <p className="text-xs text-muted-foreground mb-2">
              {results.summary}
            </p>
          )}

          {(["error", "warning", "info"] as const).map((severity) => {
            const issues = grouped[severity];
            if (issues.length === 0) return null;

            const config = severityConfig[severity];
            const Icon = config.icon;

            return issues.map((issue, i) => (
              <div
                key={`${severity}-${i}`}
                className={cn("flex items-start gap-2 rounded px-3 py-2", config.bg)}
              >
                <Icon className={cn("size-3.5 mt-0.5 shrink-0", config.color)} />
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onNavigateToPage(issue.page)}
                    className="text-xs font-mono text-primary hover:underline"
                  >
                    {issue.page}
                  </button>
                  <span className="text-[10px] uppercase tracking-wide ml-2 text-muted-foreground">
                    {issue.type.replace("_", " ")}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {issue.description}
                  </p>
                </div>
              </div>
            ));
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
