import { defineBackground } from "wxt/utils/define-background";
import { onMessage } from "../utils/messaging";
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
});
