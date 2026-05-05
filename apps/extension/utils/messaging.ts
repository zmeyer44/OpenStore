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

  // The Generate flow.
  listGenerationTypes(): ApiResult<GenerationTypeRow[]>;
  generateFile(data: {
    workspaceSlug: string;
    typeId: string;
    prompt: string;
    attachments?: { name: string; mimeType: string; dataBase64: string }[];
    lockerFileIds?: string[];
  }): ApiResult<{
    name: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  }>;

  // ── Upload flow ─────────────────────────────────────────────────────────
  // tRPC initiate / complete / abort proxy through the background so cookie
  // handling and 401 recovery sit in one place. The actual blob transfer
  // (presigned PUT, multipart parts, or the streaming endpoint) happens in
  // the popup itself — sending megabytes through chrome.runtime messaging
  // would force structured-clone serialization of the whole File on every
  // send.
  checkUploadConflicts(data: {
    workspaceSlug: string;
    folderId: string | null;
    fileNames: string[];
  }): ApiResult<{ id: string; name: string; size: number }[]>;

  initiateUpload(data: {
    workspaceSlug: string;
    folderId: string | null;
    fileName: string;
    fileSize: number;
    contentType: string;
    conflictResolution?: "replace" | "keep-both";
  }): ApiResult<InitiateUploadResponse>;

  completeUpload(data: {
    workspaceSlug: string;
    fileId: string;
    uploadId?: string;
    parts?: { partNumber: number; etag: string }[];
  }): ApiResult<true>;

  abortUpload(data: {
    workspaceSlug: string;
    fileId: string;
    uploadId?: string;
  }): ApiResult<true>;
}

export type InitiateUploadResponse =
  | {
      strategy: "server-buffered";
      fileId: string;
      storagePath: string;
    }
  | {
      strategy: "presigned-put";
      fileId: string;
      storagePath: string;
      presignedUrl: string;
    }
  | {
      strategy: "multipart";
      fileId: string;
      storagePath: string;
      uploadId: string;
      partSize: number;
      parts: { partNumber: number; url: string }[];
    };

export interface GenerationTypeRow {
  id: string;
  label: string;
  description: string;
  extension: string;
  mimeType: string;
  kind: "text" | "image";
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
