import { and, eq } from 'drizzle-orm';
import { workspacePlugins } from '@openstore/database';
import type { Database } from '@openstore/database';

const QMD_SERVICE_URL = process.env.QMD_SERVICE_URL;
const QMD_API_SECRET = process.env.QMD_API_SECRET;

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB — skip files larger than this

const NON_INDEXABLE_PREFIXES = ['image/', 'video/', 'audio/'];
const NON_INDEXABLE_TYPES = new Set([
  'application/zip',
  'application/gzip',
  'application/x-tar',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/octet-stream',
]);

function shouldIndex(mimeType: string): boolean {
  if (NON_INDEXABLE_PREFIXES.some((p) => mimeType.startsWith(p))) return false;
  if (NON_INDEXABLE_TYPES.has(mimeType)) return false;
  return true;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (QMD_API_SECRET) {
    headers['Authorization'] = `Bearer ${QMD_API_SECRET}`;
  }
  return headers;
}

export async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_CONTENT_SIZE) {
      reader.cancel();
      throw new Error(`File exceeds ${MAX_CONTENT_SIZE} byte limit for indexing`);
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join('');
}

export const qmdClient = {
  isConfigured(): boolean {
    return !!QMD_SERVICE_URL;
  },

  shouldIndex,

  async isActiveForWorkspace(db: Database, workspaceId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: workspacePlugins.id })
      .from(workspacePlugins)
      .where(
        and(
          eq(workspacePlugins.workspaceId, workspaceId),
          eq(workspacePlugins.pluginSlug, 'qmd-search'),
          eq(workspacePlugins.status, 'active'),
        ),
      )
      .limit(1);
    return !!row;
  },

  async indexFile(params: {
    workspaceId: string;
    fileId: string;
    fileName: string;
    mimeType: string;
    content: string;
  }): Promise<void> {
    if (!QMD_SERVICE_URL) return;

    const res = await fetch(`${QMD_SERVICE_URL}/index`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error(`[qmd-client] indexFile failed: ${res.status} ${res.statusText}`);
    }
  },

  async search(params: {
    workspaceId: string;
    query: string;
    limit?: number;
  }): Promise<Array<{ fileId: string; score: number; snippet?: string }>> {
    if (!QMD_SERVICE_URL) return [];

    const res = await fetch(`${QMD_SERVICE_URL}/search`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<{ fileId: string; score: number; snippet?: string }> };
    return data.results ?? [];
  },

  async deindexFile(params: {
    workspaceId: string;
    fileId: string;
  }): Promise<void> {
    if (!QMD_SERVICE_URL) return;

    await fetch(`${QMD_SERVICE_URL}/deindex`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5_000),
    });
  },
};
