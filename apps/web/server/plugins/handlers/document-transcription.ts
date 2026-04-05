import { and, eq } from "drizzle-orm";
import { files } from "@locker/database";
import { createStorageForFile } from "../../storage";
import { getBuiltinPluginBySlug } from "../catalog";
import { transcribeFile } from "../transcription";
import { transcribeWithAI } from "../../ai/transcribe";
import type {
  PluginHandler,
  PluginContext,
  ActionResult,
  ActionTarget,
  TranscriptionResult,
} from "../types";

const manifest = getBuiltinPluginBySlug("document-transcription")!;

/** Read a ReadableStream into a Buffer. */
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export const documentTranscriptionHandler: PluginHandler = {
  manifest,

  async executeAction(
    ctx: PluginContext,
    actionId: string,
    target: ActionTarget,
  ): Promise<ActionResult> {
    if (actionId === "transcription.regenerate" && target.type === "file") {
      const [file] = await ctx.db
        .select({
          mimeType: files.mimeType,
          storagePath: files.storagePath,
          storageConfigId: files.storageConfigId,
        })
        .from(files)
        .where(
          and(eq(files.id, target.id), eq(files.workspaceId, ctx.workspaceId)),
        )
        .limit(1);

      if (!file) {
        throw new Error("File not found in this workspace");
      }

      // Fire-and-forget regeneration
      void transcribeFile({
        db: ctx.db,
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        fileId: target.id,
        fileName: target.name,
        mimeType: file.mimeType,
        storagePath: file.storagePath,
        storageConfigId: file.storageConfigId,
      }).catch(() => {});

      return {
        status: "queued",
        message: `Transcription queued for "${target.name}"`,
      };
    }

    return { status: "success", message: `${actionId} completed` };
  },

  async transcribe(
    ctx: PluginContext,
    params: {
      fileId: string;
      fileName: string;
      mimeType: string;
      storagePath: string;
      storageConfigId: string | null;
    },
  ): Promise<TranscriptionResult> {
    const storage = await createStorageForFile(params.storageConfigId);
    const { data } = await storage.download(params.storagePath);
    const buffer = await streamToBuffer(data);
    const model = (ctx.config.model as string) || undefined;

    const rawServiceUrl = (ctx.config.serviceUrl as string) || undefined;
    let serviceUrl: string | undefined;
    if (rawServiceUrl) {
      let parsed: URL | null = null;
      try {
        parsed = new URL(rawServiceUrl);
      } catch {
        /* invalid */
      }
      if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(
          `Invalid serviceUrl: must be an http or https URL, got "${rawServiceUrl}"`,
        );
      }
      serviceUrl = rawServiceUrl;
    }

    // If no external service URL is configured, use the built-in AI Gateway
    if (!serviceUrl) {
      const content = await transcribeWithAI({
        buffer,
        fileName: params.fileName,
        mimeType: params.mimeType,
        model,
      });
      return { content };
    }

    // Otherwise, call the external service
    const headers: Record<string, string> = {
      "Content-Type": params.mimeType,
      "X-File-Name": encodeURIComponent(params.fileName),
    };

    const apiKey = ctx.secrets.apiKey;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    if (model) {
      headers["X-Model"] = model;
    }

    const response = await fetch(serviceUrl, {
      method: "POST",
      headers,
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Transcription service returned ${response.status}: ${errorText}`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    let content: string;

    if (contentType.includes("application/json")) {
      const json = await response.json();
      content =
        json.content ?? json.text ?? json.markdown ?? JSON.stringify(json);
    } else {
      content = await response.text();
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Transcription service returned empty content");
    }

    return { content: content.trim() };
  },
};
