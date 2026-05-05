import { defineBackground } from "wxt/utils/define-background";
import { onMessage, type InitiateUploadResponse } from "../utils/messaging";
import {
  blobToBase64,
  downloadAsBlob,
  probeSession,
  TrpcError,
  trpcMutation,
  trpcQuery,
} from "../utils/api";
import {
  getActiveWorkspaceSlug,
  isSignedIn,
  setActiveWorkspaceSlug,
  setSignedIn,
} from "../utils/storage";

interface RawWorkspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface RawFolder {
  id: string;
  name: string;
  parentId: string | null;
}

interface RawFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  // tRPC sends Date as ISO string inside the json payload (no superjson reviver here).
  updatedAt: string;
}

interface FilesListResponse {
  items: RawFile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BreadcrumbRow {
  id: string;
  name: string;
}

interface DownloadUrlResult {
  url: string;
  filename: string;
  mimeType: string;
}

export default defineBackground(() => {
  onMessage("getSignedIn", async () => isSignedIn());

  onMessage("refreshSession", async () => {
    const ok = await probeSession();
    await setSignedIn(ok);
    return ok;
  });

  onMessage("signOut", async () => {
    // Drop the local flag and best-effort hit better-auth's sign-out so the
    // server-side session ends and the cookie clears. We can't directly drop
    // an HttpOnly cookie from the extension, but better-auth's endpoint will.
    await setSignedIn(false);
    await setActiveWorkspaceSlug(null);
    try {
      await fetch(
        `${(import.meta.env as { WXT_PUBLIC_LOCKER_WEB_HOST?: string }).WXT_PUBLIC_LOCKER_WEB_HOST ?? "http://localhost:3000"}/api/auth/sign-out`,
        {
          method: "POST",
          credentials: "include",
        },
      );
    } catch {
      // best-effort
    }
    return true;
  });

  onMessage("listWorkspaces", async () => {
    try {
      const data = await trpcQuery<RawWorkspace[]>("workspaces.list", null);
      return { ok: true as const, data };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("setActiveWorkspace", async ({ data }) => {
    await setActiveWorkspaceSlug(data.slug);
    return true;
  });

  onMessage("getActiveWorkspace", async () => getActiveWorkspaceSlug());

  onMessage("listFolder", async ({ data }) => {
    try {
      const [folders, filesResp, breadcrumbs] = await Promise.all([
        trpcQuery<RawFolder[]>(
          "folders.list",
          { parentId: data.folderId },
          { workspaceSlug: data.workspaceSlug },
        ),
        trpcQuery<FilesListResponse>(
          "files.list",
          {
            folderId: data.folderId,
            page: 1,
            pageSize: 200,
            field: "name",
            direction: "asc",
            accept: data.accept,
          },
          { workspaceSlug: data.workspaceSlug },
        ),
        trpcQuery<BreadcrumbRow[]>(
          "folders.getBreadcrumbs",
          { folderId: data.folderId },
          { workspaceSlug: data.workspaceSlug },
        ),
      ]);

      return {
        ok: true as const,
        data: {
          folders: folders.map((f) => ({
            id: f.id,
            name: f.name,
            parentId: f.parentId,
          })),
          files: filesResp.items.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            mimeType: f.mimeType,
            folderId: f.folderId,
            updatedAt:
              typeof f.updatedAt === "string"
                ? f.updatedAt
                : new Date(f.updatedAt).toISOString(),
          })),
          breadcrumbs,
        },
      };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("fetchFileForUpload", async ({ data }) => {
    try {
      const meta = await trpcMutation<DownloadUrlResult>(
        "files.getDownloadUrl",
        { id: data.fileId },
        { workspaceSlug: data.workspaceSlug },
      );
      const blob = await downloadAsBlob(meta.url);
      const dataBase64 = await blobToBase64(blob);
      return {
        ok: true as const,
        data: {
          name: meta.filename,
          mimeType: meta.mimeType || blob.type || "application/octet-stream",
          size: blob.size,
          dataBase64,
        },
      };
    } catch (err) {
      const e = err as TrpcError | Error;
      const status = (e as TrpcError).status;
      if (status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status };
    }
  });

  onMessage("listGenerationTypes", async () => {
    try {
      const data = await trpcQuery<
        Array<{
          id: string;
          label: string;
          description: string;
          extension: string;
          mimeType: string;
          kind: "text" | "image";
        }>
      >("assistant.generationTypes", null);
      return { ok: true as const, data };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("generateFile", async ({ data }) => {
    try {
      const res = await callGenerateFile(data);
      return { ok: true as const, data: res };
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("checkUploadConflicts", async ({ data }) => {
    try {
      const result = await trpcQuery<
        { id: string; name: string; size: number }[]
      >(
        "uploads.checkConflicts",
        { folderId: data.folderId, fileNames: data.fileNames },
        { workspaceSlug: data.workspaceSlug },
      );
      return { ok: true as const, data: result };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("initiateUpload", async ({ data }) => {
    try {
      const result = await trpcMutation<InitiateUploadResponse>(
        "uploads.initiate",
        {
          fileName: data.fileName,
          fileSize: data.fileSize,
          contentType: data.contentType,
          folderId: data.folderId,
          conflictResolution: data.conflictResolution,
        },
        { workspaceSlug: data.workspaceSlug },
      );
      return { ok: true as const, data: result };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("completeUpload", async ({ data }) => {
    try {
      await trpcMutation<unknown>(
        "uploads.complete",
        {
          fileId: data.fileId,
          uploadId: data.uploadId,
          parts: data.parts,
        },
        { workspaceSlug: data.workspaceSlug },
      );
      return { ok: true as const, data: true as const };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });

  onMessage("abortUpload", async ({ data }) => {
    try {
      await trpcMutation<unknown>(
        "uploads.abort",
        { fileId: data.fileId, uploadId: data.uploadId },
        { workspaceSlug: data.workspaceSlug },
      );
      return { ok: true as const, data: true as const };
    } catch (err) {
      const e = err as TrpcError;
      if (e.status === 401) await setSignedIn(false);
      return { ok: false as const, error: e.message, status: e.status };
    }
  });
});

interface GenerateInput {
  workspaceSlug: string;
  typeId: string;
  prompt: string;
  attachments?: { name: string; mimeType: string; dataBase64: string }[];
  lockerFileIds?: string[];
}

async function callGenerateFile(input: GenerateInput): Promise<{
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
}> {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const host = (
    env.WXT_PUBLIC_LOCKER_WEB_HOST ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const res = await fetch(`${host}/api/ai/generate-file`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-workspace-slug": input.workspaceSlug,
    },
    body: JSON.stringify({
      typeId: input.typeId,
      prompt: input.prompt,
      attachments: input.attachments,
      lockerFileIds: input.lockerFileIds,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    const err: Error & { status?: number } = new Error(
      body?.error ?? `generate-file ${res.status}`,
    );
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as {
    name: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  };
}
