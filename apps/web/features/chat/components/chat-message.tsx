"use client";

import { useState, useCallback, useMemo, type ComponentPropsWithoutRef } from "react";
import { Copy, Check, WrapText, Paperclip } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ToolInvocation } from "./tool-invocation";

// ---------------------------------------------------------------------------
// Code block with copy + wrap toggle
// ---------------------------------------------------------------------------

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code"> & { node?: unknown }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : null;
  const code = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Inline code
  if (!language && !code.includes("\n")) {
    return (
      <code
        className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Fenced code block
  return (
    <div className="group/code relative my-4 overflow-hidden rounded-xl border border-border/50 bg-[hsl(var(--foreground))]">
      <div className="flex items-center justify-between bg-muted/60 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {language || "code"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWrap((w) => !w)}
            className={cn(
              "flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors",
              wrap && "text-primary",
            )}
          >
            <WrapText className="size-3" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre
        className={cn(
          "overflow-x-auto p-4 text-[13px] leading-relaxed",
          wrap && "whitespace-pre-wrap break-words",
        )}
      >
        <code className="font-mono text-primary-foreground" {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown renderer — editorial, generous typography
// ---------------------------------------------------------------------------

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-[1.75] text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
        components={{
          code: CodeBlock,
          p: ({ children }) => (
            <p className="mb-4 last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-xl font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 text-lg font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-base font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-5 list-disc space-y-1.5 marker:text-muted-foreground/50">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-1.5 marker:text-muted-foreground/50">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/40 text-left">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/30 px-4 py-2.5 text-muted-foreground">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-border/40" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-muted-foreground">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message component — conversational, no avatars, user bubbles right-aligned
// ---------------------------------------------------------------------------

export function ChatMessage({
  role,
  parts,
  onFileClick,
}: {
  role: string;
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
  onFileClick?: (fileId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const fullText = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("\n");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullText]);

  // Parse attachment metadata from user messages
  const { displayText, attachedFiles } = useMemo(() => {
    const attachmentMarker = "\n\n[Attached files uploaded to workspace root]";
    const idx = fullText.indexOf(attachmentMarker);
    if (idx === -1) return { displayText: fullText, attachedFiles: [] };

    const userText = fullText.slice(0, idx);
    const attachmentBlock = fullText.slice(idx + attachmentMarker.length);
    const files = attachmentBlock
      .split("\n")
      .filter((line) => line.startsWith("- "))
      .map((line) => {
        const nameMatch = line.match(/"([^"]+)"/);
        return nameMatch?.[1] ?? line.replace(/^- /, "").trim();
      });

    return { displayText: userText, attachedFiles: files };
  }, [fullText]);

  // User message — right-aligned bubble
  if (isUser) {
    return (
      <div className="flex justify-end px-4 md:px-6 py-4">
        <div className="max-w-[85%] md:max-w-[70%]">
          {/* File attachment chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5 mb-2">
              {attachedFiles.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-sm"
                >
                  <Paperclip className="size-3 shrink-0" />
                  <span className="truncate max-w-[180px]">{name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-2xl rounded-br-md bg-foreground/[0.07] px-4 py-3">
            <p className="text-[15px] leading-[1.65] text-foreground whitespace-pre-wrap">
              {displayText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message — left-aligned, free-flowing, no background
  return (
    <div className="group/msg px-4 md:px-6 py-4">
      <div className="mx-auto max-w-3xl">
        {/* Content */}
        {parts.map((part, idx) => {
          if (part.type === "text") {
            return <MarkdownContent key={idx} content={part.text ?? ""} />;
          }

          // AI SDK v6 "tool-invocation" format (from DB persistence)
          if (part.type === "tool-invocation" && part.toolInvocation) {
            const invocation = part.toolInvocation as {
              toolCallId: string;
              toolName: string;
              args: Record<string, unknown>;
              input?: Record<string, unknown>;
              state: string;
              result?: unknown;
              output?: unknown;
            };
            return (
              <ToolInvocation
                key={idx}
                invocation={invocation}
                onFileClick={onFileClick}
              />
            );
          }

          // AI SDK v6 streamed format: "tool-{toolName}" with data at top level
          if (part.type.startsWith("tool-") && part.toolCallId) {
            const toolName = part.type.replace("tool-", "");
            return (
              <ToolInvocation
                key={idx}
                invocation={{
                  toolCallId: part.toolCallId as string,
                  toolName,
                  args: (part.rawInput ?? part.input ?? {}) as Record<string, unknown>,
                  input: (part.input ?? {}) as Record<string, unknown>,
                  state: part.state as string,
                  output: part.output as unknown,
                }}
                onFileClick={onFileClick}
              />
            );
          }

          // Skip step-start and other non-renderable parts
          return null;
        })}

        {/* Copy action — appears on hover */}
        {fullText && (
          <div className="mt-1 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                copied
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {copied ? (
                <>
                  <Check className="size-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streaming indicator — subtle pulsing dot
// ---------------------------------------------------------------------------

export function StreamingIndicator() {
  return (
    <div className="px-4 md:px-6 py-6">
      <div className="mx-auto max-w-3xl flex items-center gap-2">
        <div className="size-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">
          Thinking&hellip;
        </span>
      </div>
    </div>
  );
}
