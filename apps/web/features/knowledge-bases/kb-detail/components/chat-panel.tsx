"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import {
  ChatInput,
  AVAILABLE_MODELS,
  type ModelId,
} from "./chat-input";
import { ChatMessage, StreamingIndicator } from "./chat-message";

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
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    AVAILABLE_MODELS[0].id,
  );
  const [attachments, setAttachments] = useState<File[]>([]);

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
  // conversationId transitions from null -> UUID mid-session.
  const transportBody = useRef({
    knowledgeBaseId,
    conversationId,
    model: selectedModel,
  });
  transportBody.current.knowledgeBaseId = knowledgeBaseId;
  transportBody.current.conversationId = conversationId;
  transportBody.current.model = selectedModel;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/kb/chat",
        body: transportBody.current,
      }),
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

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = () => {
    createConversationMutation.mutate({ knowledgeBaseId });
  };

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSend = () => {
    if (!inputValue.trim() || !conversationId) return;
    sendMessage({ text: inputValue });
    setInputValue("");
    setAttachments([]);
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
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/20">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <MessageSquare className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Start a conversation
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Chat with your knowledge base to find answers.
              </p>
            </div>
            <Button size="sm" onClick={handleNewConversation}>
              <Plus />
              New Conversation
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/40">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-16">
                  Ask a question about your knowledge base.
                </div>
              )}
              {messages.map((message: UIMessage) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  parts={message.parts as Array<{ type: string; text?: string; [key: string]: unknown }>}
                  onNavigateToPage={onNavigateToPage}
                />
              ))}
              {isStreaming &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <StreamingIndicator />
                )}
            </div>
            <div ref={scrollRef} />
          </ScrollArea>

          {/* Input */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            model={selectedModel}
            onModelChange={setSelectedModel}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={!conversationId}
            isSending={isStreaming}
          />
        </>
      )}
    </div>
  );
}
