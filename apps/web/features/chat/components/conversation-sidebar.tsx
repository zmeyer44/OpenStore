"use client";

import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRelativeTime } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  isCreating?: boolean;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  isCreating,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title ?? "");
  };

  const handleFinishRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-r bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-3 border-b">
        <h2 className="text-sm font-semibold text-foreground">Chats</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={onNew}
          disabled={isCreating}
          className="size-8 p-0"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 w-full overflow-y-auto">
        <div className="p-1.5 space-y-0.5 overflow-hidden">
          {conversations.length === 0 && (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="size-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No conversations yet
              </p>
            </div>
          )}

          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group/item flex items-center gap-1 rounded-lg px-2.5 py-2 cursor-pointer transition-colors overflow-hidden",
                conv.id === activeId
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/50 text-foreground",
              )}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />

              <div className="flex-1 min-w-0 ml-1.5">
                {editingId === conv.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-xs font-medium outline-none border-b border-primary"
                  />
                ) : (
                  <p className="text-xs font-medium truncate">
                    {conv.title ?? "New conversation"}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {getRelativeTime(conv.updatedAt.toISOString())}
                </p>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex size-6 items-center justify-center rounded opacity-0 group-hover/item:opacity-100 hover:bg-muted transition-all"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleStartRename(conv);
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onDelete(conv.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
