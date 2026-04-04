import { and, eq } from "drizzle-orm";
import { workspacePlugins } from "@locker/database";
import type { Database } from "@locker/database";
import type { EndpointConfig } from "./fts-client";

const QMD_SERVICE_URL = process.env.QMD_SERVICE_URL;
const QMD_API_SECRET = process.env.QMD_API_SECRET;

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB — skip files larger than this

const INDEXABLE_PREFIXES = ["text/"];
const INDEXABLE_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
]);

function shouldIndex(mimeType: string): boolean {
  if (INDEXABLE_PREFIXES.some((p) => mimeType.startsWith(p))) return true;
  return INDEXABLE_TYPES.has(mimeType);
}

function buildHeaders(secret?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["Authorization"] = `Bearer ${secret}`;
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
      await reader.cancel();
      throw new Error(
        `File exceeds ${MAX_CONTENT_SIZE} byte limit for indexing`,
      );
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join("");
}

export const qmdClient = {
  isConfigured(): boolean {
    return !!QMD_SERVICE_URL;
  },

  shouldIndex,

  async isActiveForWorkspace(
    db: Database,
    workspaceId: string,
  ): Promise<boolean> {
    const [row] = await db
      .select({ id: workspacePlugins.id })
      .from(workspacePlugins)
      .where(
        and(
          eq(workspacePlugins.workspaceId, workspaceId),
          eq(workspacePlugins.pluginSlug, "qmd-search"),
          eq(workspacePlugins.status, "active"),
        ),
      )
      .limit(1);
    return !!row;
  },

  async indexFile(
    params: {
      workspaceId: string;
      fileId: string;
      fileName: string;
      mimeType: string;
      content: string;
    },
    endpoint?: EndpointConfig,
  ): Promise<void> {
    const url = endpoint?.serviceUrl ?? QMD_SERVICE_URL;
    if (!url) return;

    const secret = endpoint?.apiSecret ?? QMD_API_SECRET;
    const res = await fetch(`${url}/index`, {
      method: "POST",
      headers: buildHeaders(secret),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error(
        `[qmd-client] indexFile failed: ${res.status} ${res.statusText}`,
      );
    }
  },

  async search(
    params: {
      workspaceId: string;
      query: string;
      limit?: number;
    },
    endpoint?: EndpointConfig,
  ): Promise<Array<{ fileId: string; score: number; snippet?: string }>> {
    const url = endpoint?.serviceUrl ?? QMD_SERVICE_URL;
    if (!url) return [];

    const secret = endpoint?.apiSecret ?? QMD_API_SECRET;
    const res = await fetch(`${url}/search`, {
      method: "POST",
      headers: buildHeaders(secret),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<{ fileId: string; score: number; snippet?: string }>;
    };
    return data.results ?? [];
  },

  async deindexFile(
    params: {
      workspaceId: string;
      fileId: string;
    },
    endpoint?: EndpointConfig,
  ): Promise<void> {
    const url = endpoint?.serviceUrl ?? QMD_SERVICE_URL;
    if (!url) return;

    const secret = endpoint?.apiSecret ?? QMD_API_SECRET;
    await fetch(`${url}/deindex`, {
      method: "POST",
      headers: buildHeaders(secret),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5_000),
    });
  },
};
