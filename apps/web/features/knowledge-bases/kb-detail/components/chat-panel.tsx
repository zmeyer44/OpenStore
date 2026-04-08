"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, Plus, Loader2, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ChatPanel({
  knowledgeBaseId,
  onNavigateToPage,
}: {
  knowledgeBaseId: string;
  onNavigateToPage?: (pagePath: string) => void;
}) {
  const utils = trpc.useUtils();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const { data: conversations } = trpc.knowledgeBases.conversations.useQuery({
    knowledgeBaseId,
  });

  const { data: conversationData } = trpc.knowledgeBases.conversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId },
  );

  const createConversationMutation =
    trpc.knowledgeBases.createConversation.useMutation({
      onSuccess: (conv) => {
        setConversationId(conv.id);
        utils.knowledgeBases.conversations.invalidate({ knowledgeBaseId });
      },
      onError: (error) => toast.error(error.message),
    });

  const deleteConversationMutation =
    trpc.knowledgeBases.deleteConversation.useMutation({
      onSuccess: () => {
        setConversationId(null);
        utils.knowledgeBases.conversations.invalidate({ knowledgeBaseId });
        toast.success("Conversation deleted");
      },
      onError: (error) => toast.error(error.message),
    });

  // Reconstruct UIMessages from DB rows
  const initialMessages: UIMessage[] = useMemo(() => {
    if (!conversationData?.messages) return [];
    return conversationData.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as UIMessage["role"],
      parts: (msg.parts as UIMessage["parts"]) ?? [
        { type: "text" as const, text: "" },
      ],
    }));
  }, [conversationData?.messages]);

  // Keep a stable transport so useChat doesn't reset when
  // conversationId transitions from null → UUID mid-session.
  // Mutate the same object in place so the transport sees current values.
  const transportBody = useRef({ knowledgeBaseId, conversationId });
  transportBody.current.knowledgeBaseId = knowledgeBaseId;
  transportBody.current.conversationId = conversationId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/kb/chat",
        body: transportBody.current,
      }),
    // Only recreate when the KB itself changes, not on conversationId updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knowledgeBaseId],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    messages: initialMessages,
    id: conversationId ?? undefined,
    onError: (error: Error) => toast.error(error.message),
  });

  // Reset messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages, setMessages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = () => {
    createConversationMutation.mutate({ knowledgeBaseId });
  };

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSend = () => {
    if (!inputValue.trim() || !conversationId) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  // Auto-select first conversation or create one
  useEffect(() => {
    if (conversations && conversations.length > 0 && !conversationId) {
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId]);

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-[200px]">
              <MessageSquare className="size-3.5" />
              <span className="truncate">
                {conversationData?.title ?? "Select conversation"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {conversations?.map((conv) => (
              <DropdownMenuItem
                key={conv.id}
                onSelect={() => setConversationId(conv.id)}
                className={conv.id === conversationId ? "bg-accent" : ""}
              >
                <span className="truncate">
                  {conv.title ?? "Untitled conversation"}
                </span>
              </DropdownMenuItem>
            ))}
            {(!conversations || conversations.length === 0) && (
              <DropdownMenuItem disabled>No conversations yet</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" variant="ghost" onClick={handleNewConversation}>
          <Plus className="size-3.5" />
          New
        </Button>

        {conversationId && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive ml-auto"
            onClick={() =>
              deleteConversationMutation.mutate({
                conversationId: conversationId!,
              })
            }
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          <div className="text-center space-y-3">
            <MessageSquare className="size-8 mx-auto text-muted-foreground/50" />
            <p>Start a conversation to chat with your knowledge base.</p>
            <Button size="sm" onClick={handleNewConversation}>
              <Plus />
              New Conversation
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Ask a question about your knowledge base.
                </div>
              )}
              {messages.map((message: UIMessage) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.role === "user" ? "bg-primary/8" : "bg-muted",
                    )}
                  >
                    {message.parts.map((part, partIdx: number) => {
                      if (part.type === "text") {
                        return (
                          <div
                            key={partIdx}
                            className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-code:text-[0.85em] dark:prose-invert"
                          >
                            <WikiLinkedMarkdown
                              content={part.text}
                              onNavigateToPage={onNavigateToPage}
                            />
                          </div>
                        );
                      }
                      if (part.type.startsWith("tool-")) {
                        return (
                          <div
                            key={partIdx}
                            className="text-xs text-muted-foreground border rounded p-2 my-1"
                          >
                            <span className="font-mono">
                              Tool:{" "}
                              {("toolName" in part && part.toolName) ||
                                "unknown"}
                            </span>
                            {"state" in part &&
                              part.state === "output-available" &&
                              "output" in part && (
                                <pre className="mt-1 text-[10px] overflow-auto">
                                  {JSON.stringify(part.output, null, 2)}
                                </pre>
                              )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
              {isStreaming &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                rows={1}
                className="resize-none min-h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={!inputValue.trim() || isStreaming}
                className="self-end"
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Renders markdown with clickable [[wiki-link]] support. */
function WikiLinkedMarkdown({
  content,
  onNavigateToPage,
}: {
  content: string;
  onNavigateToPage?: (pagePath: string) => void;
}) {
  // Split on [[...]] to get alternating text/link segments
  const parts = content.split(/(\[\[[^\]]+\]\])/g);

  return (
    <>
      {parts.map((segment, i) => {
        const match = segment.match(/^\[\[([^\]]+)\]\]$/);
        if (match) {
          const slug = match[1];
          const targetPath = slug.endsWith(".md") ? slug : `${slug}.md`;
          return (
            <button
              key={i}
              onClick={() => onNavigateToPage?.(targetPath)}
              className="inline text-primary underline cursor-pointer hover:text-primary/80 font-medium"
            >
              {slug}
            </button>
          );
        }
        if (!segment) return null;
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {segment}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
