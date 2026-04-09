"use client";

import { useState, useCallback, type ComponentPropsWithoutRef } from "react";
import { Copy, Check, WrapText, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

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
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground border border-border"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Fenced code block
  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border border-border bg-[hsl(var(--foreground))]">
      <div className="flex items-center justify-between bg-muted/80 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {language || "code"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWrap((w) => !w)}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors",
              wrap && "text-primary",
            )}
          >
            <WrapText className="size-3" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
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
// Markdown renderer (adapted to our design tokens)
// ---------------------------------------------------------------------------

function MarkdownContent({
  content,
  onNavigateToPage,
}: {
  content: string;
  onNavigateToPage?: (path: string) => void;
}) {
  // Convert [[wiki-links]] to markdown links with custom protocol
  const processed = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, slug) => `[${slug}](wiki://${slug})`,
  );

  return (
    <div className="text-sm leading-[1.7] text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
        components={{
          code: CodeBlock,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-lg font-semibold text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/30 bg-primary/5 py-1 pl-4 text-[13px] text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children, ...props }) => {
            if (href?.startsWith("wiki://")) {
              const slug = href.replace("wiki://", "");
              const targetPath = slug.endsWith(".md") ? slug : `${slug}.md`;
              return (
                <button
                  onClick={() => onNavigateToPage?.(targetPath)}
                  className={cn(
                    "inline-flex items-center gap-0.5 text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80 font-medium",
                  )}
                >
                  <BookOpen className="size-3 inline" />
                  {children}
                </button>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
                {...props}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 text-left">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/50 px-3 py-2 text-muted-foreground">
              {children}
            </td>
          ),
          hr: () => <hr className="my-4 border-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-muted-foreground">{children}</em>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message component
// ---------------------------------------------------------------------------

export function ChatMessage({
  role,
  parts,
  onNavigateToPage,
}: {
  role: string;
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
  onNavigateToPage?: (path: string) => void;
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

  return (
    <div
      className={cn(
        "group/msg py-5 px-4 md:px-6",
        !isUser && "bg-muted/30",
      )}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full mt-0.5",
              isUser
                ? "bg-foreground text-background"
                : "bg-primary/10 border border-primary/20",
            )}
          >
            <span
              className={cn(
                "font-mono text-[10px] font-bold",
                !isUser && "text-primary",
              )}
            >
              {isUser ? "U" : "AI"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Role label */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                {isUser ? "You" : "Assistant"}
              </span>
            </div>

            {/* Content */}
            {parts.map((part, idx) => {
              if (part.type === "text") {
                return isUser ? (
                  <p key={idx} className="text-sm leading-[1.7] text-foreground whitespace-pre-wrap">
                    {part.text}
                  </p>
                ) : (
                  <MarkdownContent
                    key={idx}
                    content={part.text ?? ""}
                    onNavigateToPage={onNavigateToPage}
                  />
                );
              }
              if (part.type.startsWith("tool-")) {
                return (
                  <div
                    key={idx}
                    className="text-xs text-muted-foreground border border-border rounded-lg p-2 my-1 bg-muted/30"
                  >
                    <span className="font-mono">
                      Tool: {(part.toolName as string) || "unknown"}
                    </span>
                    {part.state === "output-available" && part.output != null ? (
                      <pre className="mt-1 text-[10px] overflow-auto">
                        {JSON.stringify(part.output, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                );
              }
              return null;
            })}

            {/* Actions toolbar */}
            {!isUser && fullText && (
              <div className="mt-2 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={copied ? "Copied" : "Copy"}
                >
                  {copied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streaming indicator
// ---------------------------------------------------------------------------

export function StreamingIndicator() {
  return (
    <div className="py-5 px-4 md:px-6 bg-muted/30">
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full mt-0.5 bg-primary/10 border border-primary/20">
            <span className="font-mono text-[10px] font-bold text-primary">
              AI
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Assistant
              </span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <div
                  className="size-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="size-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="size-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Thinking...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
