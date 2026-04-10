"use client";

import { useState, useCallback } from "react";
import { Check, Copy, ExternalLink, Lock, Clock, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShareLinkData {
  shareUrl: string;
  access: "view" | "download";
  hasPassword?: boolean;
  expiresAt?: string | null;
  maxDownloads?: number | null;
}

export function ShareLinkCard({ link }: { link: ShareLinkData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(link.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link.shareUrl]);

  const hasDetails =
    link.hasPassword || link.expiresAt || link.maxDownloads;

  // Format expiration as relative or absolute
  const expiresLabel = link.expiresAt
    ? formatExpiry(new Date(link.expiresAt))
    : null;

  return (
    <div
      className={cn(
        "group/share w-full max-w-md rounded-xl border border-border/50",
        "bg-background shadow-sm transition-all",
        "hover:border-border hover:shadow-md",
      )}
    >
      {/* Main row: icon + URL + copy */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Link icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ExternalLink className="size-4.5 text-primary" />
        </div>

        {/* URL */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Share link</p>
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            {link.shareUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            copied
              ? "bg-primary/10 text-primary"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Detail chips */}
      {hasDetails && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/30 px-4 py-2">
          {link.access === "download" && (
            <Chip icon={Download} label="Download" />
          )}
          {link.hasPassword && <Chip icon={Lock} label="Password" />}
          {expiresLabel && <Chip icon={Clock} label={expiresLabel} />}
          {link.maxDownloads && (
            <Chip
              icon={Download}
              label={`${link.maxDownloads} download${link.maxDownloads === 1 ? "" : "s"} max`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function formatExpiry(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return "Expired";

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Expires today";
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  return `Expires ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
