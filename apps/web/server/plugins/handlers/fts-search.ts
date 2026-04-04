import { and, eq } from "drizzle-orm";
import { files } from "@locker/database";
import { createStorageForFile } from "../../storage";
import { getBuiltinPluginBySlug } from "../catalog";
import { ftsClient } from "./fts-client";
import type { EndpointConfig } from "./fts-client";
import { streamToString } from "./qmd-client";
import type {
  PluginHandler,
  PluginContext,
  ActionResult,
  ActionTarget,
  SearchResult,
} from "../types";

const manifest = getBuiltinPluginBySlug("fts-search")!;

function endpointFromCtx(ctx: PluginContext): EndpointConfig {
  return {
    serviceUrl: (ctx.config.serviceUrl as string) || undefined,
    apiSecret: ctx.secrets.apiSecret || undefined,
  };
}

export const ftsSearchHandler: PluginHandler = {
  manifest,

  async executeAction(
    ctx: PluginContext,
    actionId: string,
    target: ActionTarget,
  ): Promise<ActionResult> {
    if (actionId === "fts.reindex-file" && target.type === "file") {
      try {
        const [file] = await ctx.db
          .select({
            storagePath: files.storagePath,
            mimeType: files.mimeType,
            storageConfigId: files.storageConfigId,
          })
          .from(files)
          .where(
            and(
              eq(files.id, target.id),
              eq(files.workspaceId, ctx.workspaceId),
            ),
          )
          .limit(1);

        if (file && ftsClient.shouldIndex(file.mimeType)) {
          const storage = await createStorageForFile(file.storageConfigId);
          const { data } = await storage.download(file.storagePath);
          const content = await streamToString(data);

          await ftsClient.indexFile(
            {
              workspaceId: ctx.workspaceId,
              fileId: target.id,
              fileName: target.name,
              mimeType: file.mimeType,
              content,
            },
            endpointFromCtx(ctx),
          );
        }
      } catch {
        // Best-effort indexing
      }

      return {
        status: "success",
        message: `Re-indexed "${target.name}" for full-text search`,
      };
    }

    return {
      status: "success",
      message: `${actionId} completed`,
    };
  },

  async search(
    ctx: PluginContext,
    params: { query: string; folderId?: string | null; limit?: number },
  ): Promise<SearchResult[]> {
    return ftsClient.search(
      {
        workspaceId: ctx.workspaceId,
        query: params.query,
        limit: params.limit ?? 20,
      },
      endpointFromCtx(ctx),
    );
  },
};
