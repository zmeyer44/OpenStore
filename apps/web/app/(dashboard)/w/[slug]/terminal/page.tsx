"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/lib/workspace-context";

interface HistoryEntry {
  id: number;
  cwd: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export default function TerminalPage() {
  const workspace = useWorkspace();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cwd, setCwd] = useState("/");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryIdRef = useRef(0);

  const createSession = trpc.vfsShell.createSession.useMutation();
  const exec = trpc.vfsShell.exec.useMutation();

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false;
    createSession
      .mutateAsync({ cwd: "/" })
      .then((result) => {
        if (cancelled) return;
        setSessionId(result.sessionId);
        setCwd(result.cwd);
        setInitializing(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to create session",
        );
        setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, running]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || !sessionId || running) return;

      // Handle client-side clear
      if (trimmed === "clear") {
        setHistory([]);
        setInput("");
        setCommandHistory((prev) => [...prev, trimmed]);
        setHistoryIndex(-1);
        return;
      }

      setRunning(true);
      setInput("");
      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      const entryId = ++entryIdRef.current;
      const entryCwd = cwd;

      try {
        const result = await exec.mutateAsync({
          sessionId,
          command: trimmed,
        });
        setCwd(result.cwd);
        setHistory((prev) => [
          ...prev,
          {
            id: entryId,
            cwd: entryCwd,
            command: trimmed,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
          },
        ]);
      } catch (err) {
        setHistory((prev) => [
          ...prev,
          {
            id: entryId,
            cwd: entryCwd,
            command: trimmed,
            stdout: "",
            stderr: err instanceof Error ? err.message : "Command failed",
            exitCode: 1,
            durationMs: 0,
          },
        ]);
      } finally {
        setRunning(false);
        // Refocus input after command completes
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [input, sessionId, running, cwd, exec],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (commandHistory.length === 0) return;
        const nextIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]!);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex === -1) return;
        const nextIndex = historyIndex + 1;
        if (nextIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(nextIndex);
          setInput(commandHistory[nextIndex]!);
        }
      }
    },
    [commandHistory, historyIndex],
  );

  const focusInput = () => inputRef.current?.focus();

  if (initializing) {
    return (
      <div>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
          <div className="flex flex-1 items-center gap-2 px-4">
            <TerminalIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Terminal</span>
          </div>
        </header>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Starting shell session...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
          <div className="flex flex-1 items-center gap-2 px-4">
            <TerminalIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Terminal</span>
          </div>
        </header>
        <div className="p-6">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex flex-1 items-center gap-2 px-4">
          <TerminalIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="px-4 text-xs text-muted-foreground font-mono">
          {cwd}
        </div>
      </header>

      <div
        ref={scrollRef}
        onClick={focusInput}
        className="flex-1 overflow-y-auto bg-zinc-950 p-4 font-mono text-sm cursor-text"
      >
        {/* Welcome message */}
        <div className="text-zinc-500 mb-4">
          Locker Shell — {workspace.name}
          {"\n"}Type commands to explore your workspace files. This is a
          read-only shell.
        </div>

        {/* History */}
        {history.map((entry) => (
          <div key={entry.id} className="mb-2">
            {/* Prompt + command */}
            <div className="flex">
              <span className="text-emerald-400 shrink-0 select-none">
                {entry.cwd}
              </span>
              <span className="text-zinc-500 mx-1 select-none">$</span>
              <span className="text-zinc-100">{entry.command}</span>
            </div>
            {/* stdout */}
            {entry.stdout && (
              <pre className="text-zinc-300 whitespace-pre-wrap break-all">
                {entry.stdout}
              </pre>
            )}
            {/* stderr */}
            {entry.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap break-all">
                {entry.stderr}
              </pre>
            )}
          </div>
        ))}

        {/* Running indicator */}
        {running && (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="size-3 animate-spin" />
            <span>Running...</span>
          </div>
        )}

        {/* Active prompt */}
        {!running && (
          <form onSubmit={handleSubmit} className="flex">
            <span className="text-emerald-400 shrink-0 select-none">{cwd}</span>
            <span className="text-zinc-500 mx-1 select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setHistoryIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="flex-1 bg-transparent text-zinc-100 outline-none caret-zinc-100"
            />
          </form>
        )}
      </div>
    </div>
  );
}
