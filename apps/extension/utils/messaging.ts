import { defineExtensionMessaging } from "@webext-core/messaging";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface FolderRow {
  id: string;
  name: string;
  parentId: string | null;
}

export interface FileRow {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  updatedAt: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

interface ProtocolMap {
  // Auth handshake
  getSignedIn(): boolean;
  refreshSession(): boolean;
  signOut(): boolean;

  // Workspace + browse
  listWorkspaces(): ApiResult<Workspace[]>;
  setActiveWorkspace(data: { slug: string }): boolean;
  getActiveWorkspace(): string | null;
  listFolder(data: {
    workspaceSlug: string;
    folderId: string | null;
    // HTML5 input.accept tokens forwarded as-is. Filtering happens server-
    // side in files.list — folders are never filtered by accept since you
    // may need to drill into a subfolder to find a matching file.
    accept?: string[];
  }): ApiResult<{
    folders: FolderRow[];
    files: FileRow[];
    breadcrumbs: Breadcrumb[];
  }>;

  // For the content-script picker: hand back a base64 data URL the page can
  // turn into a File. Going through base64 keeps the postMessage path simple
  // (Blob can't cross the structured-clone boundary into all contexts cleanly
  // when the dialog is rendered inside the page's frame).
  fetchFileForUpload(data: {
    workspaceSlug: string;
    fileId: string;
  }): ApiResult<{
    name: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  }>;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
