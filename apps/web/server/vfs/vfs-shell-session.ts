import { randomUUID } from "node:crypto";
import { Bash } from "just-bash";
import type { Database } from "@openstore/database";
import type { StorageProvider } from "@openstore/storage";
import { OpenStoreVirtualFileSystem } from "./openstore-vfs";
import { optimizedGrepCommand } from "./grep-command";

type OpenStoreVfsType = OpenStoreVirtualFileSystem;

const SESSION_TTL_MS = readPositiveInt(
  process.env.OPENSTORE_VFS_SESSION_TTL_MS,
  20 * 60 * 1000,
);
const DEFAULT_COMMAND_TIMEOUT_MS = readPositiveInt(
  process.env.OPENSTORE_VFS_COMMAND_TIMEOUT_MS,
  12_000,
);
const MAX_COMMAND_TIMEOUT_MS = readPositiveInt(
  process.env.OPENSTORE_VFS_COMMAND_TIMEOUT_MAX_MS,
  60_000,
);

interface VfsShellSession {
  id: string;
  workspaceId: string;
  userId: string;
  fs: OpenStoreVfsType;
  bash: Bash;
  cwd: string;
  env: Record<string, string>;
  hasCapturedEnv: boolean;
  lastUsedAt: number;
}

const sessionsById = new Map<string, VfsShellSession>();

const PRUNE_THROTTLE_MS = 30_000;
const MAX_SESSIONS_PER_WORKSPACE = 20;
let lastPruneAt = 0;

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getSessionExpiryTime(session: VfsShellSession): number {
  return session.lastUsedAt + SESSION_TTL_MS;
}

function pruneExpiredSessions(): void {
  const now = Date.now();
  if (now - lastPruneAt < PRUNE_THROTTLE_MS) return;
  lastPruneAt = now;

  for (const [sessionId, session] of sessionsById.entries()) {
    if (getSessionExpiryTime(session) <= now) {
      sessionsById.delete(sessionId);
    }
  }
}

function enforceWorkspaceSessionCap(workspaceId: string): void {
  const workspaceSessions: VfsShellSession[] = [];
  for (const session of sessionsById.values()) {
    if (session.workspaceId === workspaceId) {
      workspaceSessions.push(session);
    }
  }

  if (workspaceSessions.length < MAX_SESSIONS_PER_WORKSPACE) return;

  // Evict oldest sessions until under the cap
  workspaceSessions.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
  const toEvict = workspaceSessions.length - MAX_SESSIONS_PER_WORKSPACE + 1;
  for (let i = 0; i < toEvict; i++) {
    sessionsById.delete(workspaceSessions[i]!.id);
  }
}

async function resolveSafeDirectory(params: {
  fs: OpenStoreVfsType;
  requestedCwd: string;
  fallbackCwd: string;
}): Promise<string> {
  const resolved = params.fs.resolvePath(
    params.fallbackCwd,
    params.requestedCwd,
  );
  const exists = await params.fs.exists(resolved);
  if (!exists) return params.fallbackCwd;

  try {
    const stat = await params.fs.stat(resolved);
    if (!stat.isDirectory) return params.fallbackCwd;
    return resolved;
  } catch {
    return params.fallbackCwd;
  }
}

function normalizeTimeout(timeoutMs: number | undefined): number {
  const desired = timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
  if (!Number.isFinite(desired)) return DEFAULT_COMMAND_TIMEOUT_MS;
  const rounded = Math.floor(desired);
  if (rounded < 500) return 500;
  if (rounded > MAX_COMMAND_TIMEOUT_MS) return MAX_COMMAND_TIMEOUT_MS;
  return rounded;
}

function sessionSummary(session: VfsShellSession): {
  sessionId: string;
  cwd: string;
  expiresAt: Date;
} {
  return {
    sessionId: session.id,
    cwd: session.cwd,
    expiresAt: new Date(getSessionExpiryTime(session)),
  };
}

function getOwnedSession(params: {
  sessionId: string;
  workspaceId: string;
  userId: string;
}): VfsShellSession {
  pruneExpiredSessions();
  const session = sessionsById.get(params.sessionId);
  if (!session) {
    throw new VfsShellSessionNotFoundError();
  }
  if (
    session.workspaceId !== params.workspaceId ||
    session.userId !== params.userId
  ) {
    throw new VfsShellSessionAccessDeniedError();
  }
  return session;
}

export async function createVfsShellSession(params: {
  db: Database;
  storage: StorageProvider;
  workspaceId: string;
  userId: string;
  cwd?: string;
}): Promise<{ sessionId: string; cwd: string; expiresAt: Date }> {
  pruneExpiredSessions();
  enforceWorkspaceSessionCap(params.workspaceId);

  const fs = await OpenStoreVirtualFileSystem.create({
    db: params.db,
    workspaceId: params.workspaceId,
    storage: params.storage,
  });

  const requestedCwd = params.cwd?.trim() || "/";
  const cwd = await resolveSafeDirectory({
    fs,
    requestedCwd,
    fallbackCwd: "/",
  });

  const bash = new Bash({
    fs,
    cwd,
    customCommands: [optimizedGrepCommand],
  });

  const now = Date.now();
  const session: VfsShellSession = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    userId: params.userId,
    fs,
    bash,
    cwd,
    env: {},
    hasCapturedEnv: false,
    lastUsedAt: now,
  };

  sessionsById.set(session.id, session);
  return sessionSummary(session);
}

export async function executeVfsShellCommand(params: {
  sessionId: string;
  workspaceId: string;
  userId: string;
  command: string;
  timeoutMs?: number;
}): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
  durationMs: number;
  expiresAt: Date;
}> {
  const session = getOwnedSession({
    sessionId: params.sessionId,
    workspaceId: params.workspaceId,
    userId: params.userId,
  });

  const timeoutMs = normalizeTimeout(params.timeoutMs);
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const result = await session.bash.exec(params.command, {
      cwd: session.cwd,
      env: session.env,
      replaceEnv: session.hasCapturedEnv,
      signal: controller.signal,
    });

    session.env = result.env;
    session.hasCapturedEnv = true;
    session.cwd = await resolveSafeDirectory({
      fs: session.fs,
      requestedCwd: result.env.PWD ?? session.cwd,
      fallbackCwd: session.cwd,
    });
    session.lastUsedAt = Date.now();

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      cwd: session.cwd,
      durationMs: Date.now() - startedAt,
      expiresAt: new Date(getSessionExpiryTime(session)),
    };
  } catch (error) {
    const timedOut =
      controller.signal.aborted && Date.now() - startedAt >= timeoutMs;
    session.lastUsedAt = Date.now();

    return {
      stdout: "",
      stderr: timedOut
        ? `Command timed out after ${timeoutMs}ms\n`
        : `${error instanceof Error ? error.message : String(error)}\n`,
      exitCode: timedOut ? 124 : 1,
      cwd: session.cwd,
      durationMs: Date.now() - startedAt,
      expiresAt: new Date(getSessionExpiryTime(session)),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function closeVfsShellSession(params: {
  sessionId: string;
  workspaceId: string;
  userId: string;
}): { success: true } {
  getOwnedSession(params);
  sessionsById.delete(params.sessionId);
  return { success: true };
}

export function getVfsShellSessionSummary(params: {
  sessionId: string;
  workspaceId: string;
  userId: string;
}): { sessionId: string; cwd: string; expiresAt: Date } {
  const session = getOwnedSession(params);
  return sessionSummary(session);
}

export class VfsShellSessionNotFoundError extends Error {
  constructor() {
    super("Shell session not found");
    this.name = "VfsShellSessionNotFoundError";
  }
}

export class VfsShellSessionAccessDeniedError extends Error {
  constructor() {
    super("Shell session access denied");
    this.name = "VfsShellSessionAccessDeniedError";
  }
}
