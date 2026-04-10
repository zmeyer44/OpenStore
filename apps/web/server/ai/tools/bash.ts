import { tool } from "ai";
import { z } from "zod/v4";
import { createStorageForWorkspace } from "../../storage";
import {
  createVfsShellSession,
  executeVfsShellCommand,
} from "../../vfs/vfs-shell-session";
import type { AssistantToolContext } from "./types";

/** Max output bytes returned to the model to protect the context window. */
const MAX_OUTPUT_BYTES = 8_000;

/** Truncate a string to `maxBytes` and append a notice if clipped. */
function truncateOutput(text: string, maxBytes: number): string {
  if (text.length <= maxBytes) return text;
  const truncated = text.slice(0, maxBytes);
  const remaining = text.length - maxBytes;
  return `${truncated}\n\n--- output truncated (${remaining} chars omitted) ---`;
}

/**
 * Create the bash tool for the AI assistant.
 *
 * A VFS shell session is created lazily on the first invocation and reused
 * for all subsequent calls within the same streamText run (up to 10 steps).
 * The session is read-only — all write operations are blocked by the VFS.
 */
export function createBashTools(ctx: AssistantToolContext) {
  let sessionId: string | null = null;

  return {
    bash: tool({
      description:
        "Execute a bash command in the workspace's read-only virtual file system. " +
        "Use this to explore files and folders: ls, cat, head, tail, find, grep, wc, du, tree, etc. " +
        "The file system is read-only — write operations (mkdir, rm, mv, cp, touch, etc.) will fail. " +
        "Use the dedicated file/folder tools for mutations. " +
        "Pipe and compose commands freely (e.g. `find . -name '*.pdf' | head -5`, `grep -r 'keyword' .`). " +
        "The working directory persists between calls.",
      inputSchema: z.object({
        command: z
          .string()
          .min(1)
          .max(10_000)
          .describe("The bash command to execute"),
      }),
      execute: async ({ command }) => {
        // Lazily create a VFS session on first use
        if (!sessionId) {
          const { storage } = await createStorageForWorkspace(ctx.workspaceId);
          const session = await createVfsShellSession({
            db: ctx.db,
            storage,
            workspaceId: ctx.workspaceId,
            userId: ctx.userId,
          });
          sessionId = session.sessionId;
        }

        const result = await executeVfsShellCommand({
          sessionId,
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          command,
          timeoutMs: 30_000,
        });

        const stdout = truncateOutput(result.stdout, MAX_OUTPUT_BYTES);
        const stderr = truncateOutput(result.stderr, MAX_OUTPUT_BYTES);

        return {
          stdout: stdout || undefined,
          stderr: stderr || undefined,
          exitCode: result.exitCode,
          cwd: result.cwd,
        };
      },
    }),
  };
}
