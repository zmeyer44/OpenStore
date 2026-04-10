"use client";

import { Bot, FolderSearch, Share2, Tags, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  {
    icon: FileSearch,
    label: "Search my files",
    prompt: "What files do I have in my workspace?",
  },
  {
    icon: FolderSearch,
    label: "Organize files",
    prompt: "Create a new folder called 'Documents' and list my root files",
  },
  {
    icon: Share2,
    label: "Share a file",
    prompt: "Show me all my active share links",
  },
  {
    icon: Tags,
    label: "Manage tags",
    prompt: "What tags are available in my workspace?",
  },
];

export function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Bot className="size-7 text-primary" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Locker Assistant
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            I can help you manage your files, create folders, generate share
            links, search your workspace, and more. Just ask!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTIONS.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.label}
                onClick={() => onSuggestionClick(suggestion.prompt)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-left",
                  "hover:border-primary/30 hover:bg-primary/5 transition-all",
                )}
              >
                <Icon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  {suggestion.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
