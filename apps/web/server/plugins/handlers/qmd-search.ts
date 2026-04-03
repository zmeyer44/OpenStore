import { createStorage } from '@openstore/storage';
import { getBuiltinPluginBySlug } from '../catalog';
import { qmdClient, streamToString } from './qmd-client';
import type {
  PluginHandler,
  PluginContext,
  ActionResult,
  ActionTarget,
  SearchResult,
} from '../types';

const manifest = getBuiltinPluginBySlug('qmd-search')!;

export const qmdSearchHandler: PluginHandler = {
  manifest,

  async executeAction(
    ctx: PluginContext,
    actionId: string,
    target: ActionTarget,
  ): Promise<ActionResult> {
    if (actionId === 'qmd.reindex-file' && target.type === 'file') {
      if (!qmdClient.isConfigured()) {
        return {
          status: 'success',
          message: 'QMD service is not configured',
        };
      }

      try {
        const { files } = await import('@openstore/database');
        const { eq, and } = await import('drizzle-orm');

        const [file] = await ctx.db
          .select({ storagePath: files.storagePath, mimeType: files.mimeType })
          .from(files)
          .where(
            and(
              eq(files.id, target.id),
              eq(files.workspaceId, ctx.workspaceId),
            ),
          )
          .limit(1);

        if (file && qmdClient.shouldIndex(file.mimeType)) {
          const storage = createStorage();
          const { data } = await storage.download(file.storagePath);
          const content = await streamToString(data);

          await qmdClient.indexFile({
            workspaceId: ctx.workspaceId,
            fileId: target.id,
            fileName: target.name,
            mimeType: file.mimeType,
            content,
          });
        }
      } catch {
        // Best-effort indexing
      }

      return {
        status: 'queued',
        message: `Queued "${target.name}" for discovery re-indexing`,
      };
    }

    return {
      status: 'success',
      message: `${actionId} completed`,
    };
  },

  async search(
    ctx: PluginContext,
    params: { query: string; folderId?: string | null; limit?: number },
  ): Promise<SearchResult[]> {
    // Use the QMD service if configured
    if (qmdClient.isConfigured()) {
      try {
        return await qmdClient.search({
          workspaceId: ctx.workspaceId,
          query: params.query,
          limit: params.limit ?? 20,
        });
      } catch {
        // Fall through to filename scoring
      }
    }

    // Fallback: score workspace files by name matching
    const { files } = await import('@openstore/database');
    const { eq, and, ilike } = await import('drizzle-orm');

    const query = params.query.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    const escapedQuery = query.replace(/[%_\\]/g, '\\$&');
    const rows = await ctx.db
      .select({ id: files.id, name: files.name })
      .from(files)
      .where(
        and(
          eq(files.workspaceId, ctx.workspaceId),
          ilike(files.name, `%${escapedQuery}%`),
        ),
      )
      .limit(params.limit ?? 50);

    return rows
      .map((row) => ({
        fileId: row.id,
        score: scoreByQuery(row.name, query, tokens),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  },
};

function scoreByQuery(name: string, query: string, tokens: string[]): number {
  const n = name.toLowerCase();
  let score = 0;
  if (n === query) score += 80;
  if (n.startsWith(query)) score += 35;
  if (n.includes(query)) score += 15;
  for (const t of tokens) {
    if (t.length >= 2 && n.includes(t)) score += 7;
  }
  if (/\.(pdf|md|doc|docx|txt)$/.test(n)) score += 4;
  return score;
}
