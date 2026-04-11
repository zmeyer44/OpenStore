import { eq, and, isNull, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { folders, files, workspaces } from "@locker/database";
import type { Database } from "@locker/database";
import { invalidateWorkspaceVfsSnapshot } from "../vfs/locker-vfs";
import { createStorageForFile, getFileStoragePath } from "../storage";
import {
  createPendingFileUpload,
  markFileUploadReady,
} from "../stores/file-records";
import { deleteFileEverywhere } from "../stores/lifecycle";

// ---------------------------------------------------------------------------
// PluginStorage interface
// ---------------------------------------------------------------------------

export interface PluginStorage {
  /** Upload a file into this plugin's storage folder. */
  upload(params: {
    fileName: string;
    data: Buffer | ReadableStream;
    contentType: string;
    /** Size in bytes. Required for accurate quota tracking when data is a ReadableStream. */
    size?: number;
    /** Optional subfolder within the plugin folder, e.g. "images". */
    subPath?: string;
  }): Promise<{ fileId: string; storagePath: string }>;

  /** Download a file previously stored by this plugin. */
  download(fileId: string): Promise<{
    data: ReadableStream;
    contentType: string;
    size: number;
  }>;

  /** Get a signed URL for a plugin-stored file. */
  getSignedUrl(fileId: string, expiresIn?: number): Promise<string>;

  /** Delete a plugin-stored file (removes from storage and DB). */
  delete(fileId: string): Promise<void>;

  /** List files stored by this plugin. */
  listFiles(subPath?: string): Promise<
    Array<{
      id: string;
      name: string;
      size: number;
      mimeType: string;
      createdAt: Date;
    }>
  >;
}

// ---------------------------------------------------------------------------
// Folder initialization (idempotent, cached)
// ---------------------------------------------------------------------------

interface FolderIds {
  rootFolderId: string;
  pluginFolderId: string;
}

interface CacheEntry {
  promise: Promise<FolderIds>;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const folderCache = new Map<string, CacheEntry>();

async function ensurePluginFolder(
  db: Database,
  workspaceId: string,
  userId: string,
  pluginSlug: string,
): Promise<FolderIds> {
  const cacheKey = `${workspaceId}:${pluginSlug}`;
  const cached = folderCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = (async (): Promise<FolderIds> => {
    // Ensure .plugins root folder
    let [rootFolder] = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.workspaceId, workspaceId),
          isNull(folders.parentId),
          eq(folders.name, ".plugins"),
        ),
      )
      .limit(1);

    if (!rootFolder) {
      [rootFolder] = await db
        .insert(folders)
        .values({
          workspaceId,
          userId,
          parentId: null,
          name: ".plugins",
        })
        .returning({ id: folders.id });
    }

    // Ensure plugin-specific subfolder
    let [pluginFolder] = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.workspaceId, workspaceId),
          eq(folders.parentId, rootFolder.id),
          eq(folders.name, pluginSlug),
        ),
      )
      .limit(1);

    if (!pluginFolder) {
      [pluginFolder] = await db
        .insert(folders)
        .values({
          workspaceId,
          userId,
          parentId: rootFolder.id,
          name: pluginSlug,
        })
        .returning({ id: folders.id });
    }

    return {
      rootFolderId: rootFolder.id,
      pluginFolderId: pluginFolder.id,
    };
  })();

  // Cache with TTL; evict on failure
  folderCache.set(cacheKey, {
    promise,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  promise.catch(() => folderCache.delete(cacheKey));

  return promise;
}

/** Resolve or create a subfolder within the plugin folder. */
async function ensureSubFolder(
  db: Database,
  workspaceId: string,
  userId: string,
  parentId: string,
  name: string,
): Promise<string> {
  let [folder] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(
        eq(folders.workspaceId, workspaceId),
        eq(folders.parentId, parentId),
        eq(folders.name, name),
      ),
    )
    .limit(1);

  if (!folder) {
    [folder] = await db
      .insert(folders)
      .values({ workspaceId, userId, parentId, name })
      .returning({ id: folders.id });
  }

  return folder.id;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPluginStorage(params: {
  db: Database;
  workspaceId: string;
  userId: string;
  pluginSlug: string;
}): PluginStorage {
  const { db, workspaceId, userId, pluginSlug } = params;

  async function resolveFolderId(subPath?: string): Promise<string> {
    const { pluginFolderId } = await ensurePluginFolder(
      db,
      workspaceId,
      userId,
      pluginSlug,
    );

    if (!subPath) return pluginFolderId;

    // Walk or create nested subfolders (e.g. "images/chat")
    let currentId = pluginFolderId;
    for (const segment of subPath.split("/").filter(Boolean)) {
      currentId = await ensureSubFolder(
        db,
        workspaceId,
        userId,
        currentId,
        segment,
      );
    }
    return currentId;
  }

  return {
    async upload(uploadParams) {
      const folderId = await resolveFolderId(uploadParams.subPath);
      const pending = await createPendingFileUpload({
        db,
        workspaceId,
        userId,
        folderId,
        fileName: uploadParams.fileName,
        mimeType: uploadParams.contentType,
        size:
          uploadParams.size ??
          (uploadParams.data instanceof Buffer
            ? uploadParams.data.byteLength
            : 0),
        status: "uploading",
      });

      await pending.storage.upload({
        path: pending.storagePath,
        data: uploadParams.data,
        contentType: uploadParams.contentType,
      });
      await markFileUploadReady({ db, fileId: pending.fileId });

      // Compute size for DB entry
      const size =
        uploadParams.size ??
        (uploadParams.data instanceof Buffer
          ? uploadParams.data.byteLength
          : 0);

      // Update workspace storage usage
      if (size > 0) {
        await db
          .update(workspaces)
          .set({
            storageUsed: sql`${workspaces.storageUsed} + ${size}`,
          })
          .where(eq(workspaces.id, workspaceId));
      }

      invalidateWorkspaceVfsSnapshot(workspaceId);

      return { fileId: pending.fileId, storagePath: pending.storagePath };
    },

    async download(fileId) {
      const [file] = await db
        .select({ id: files.id })
        .from(files)
        .where(
          and(eq(files.id, fileId), eq(files.workspaceId, workspaceId)),
        )
        .limit(1);

      if (!file) throw new Error("File not found");

      const storage = await createStorageForFile(file.id);
      return storage.download(await getFileStoragePath(file.id));
    },

    async getSignedUrl(fileId, expiresIn) {
      const [file] = await db
        .select({ id: files.id })
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.workspaceId, workspaceId)))
        .limit(1);

      if (!file) throw new Error("File not found");

      const storage = await createStorageForFile(file.id);
      return storage.getSignedUrl(await getFileStoragePath(file.id), expiresIn);
    },

    async delete(fileId) {
      const [file] = await db
        .select({
          storagePath: files.storagePath,
          size: files.size,
        })
        .from(files)
        .where(
          and(eq(files.id, fileId), eq(files.workspaceId, workspaceId)),
        )
        .limit(1);

      if (!file) return;

      await deleteFileEverywhere({
        db,
        workspaceId,
        fileId,
        deletedByUserId: userId,
      });
    },

    async listFiles(subPath) {
      const folderId = await resolveFolderId(subPath);

      return db
        .select({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(
          and(
            eq(files.workspaceId, workspaceId),
            eq(files.folderId, folderId),
          ),
        );
    },
  };
}

// ---------------------------------------------------------------------------
// Cleanup (for plugin uninstall)
// ---------------------------------------------------------------------------

export async function cleanupPluginStorage(params: {
  db: Database;
  workspaceId: string;
  pluginSlug: string;
}): Promise<void> {
  const { db, workspaceId, pluginSlug } = params;

  // Find the .plugins root folder
  const [rootFolder] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(
        eq(folders.workspaceId, workspaceId),
        isNull(folders.parentId),
        eq(folders.name, ".plugins"),
      ),
    )
    .limit(1);

  if (!rootFolder) return;

  // Find the plugin subfolder
  const [pluginFolder] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(
        eq(folders.workspaceId, workspaceId),
        eq(folders.parentId, rootFolder.id),
        eq(folders.name, pluginSlug),
      ),
    )
    .limit(1);

  if (!pluginFolder) return;

  // Collect all folder IDs (plugin folder + any nested subfolders)
  const allFolderIds = [pluginFolder.id];
  let frontier = [pluginFolder.id];
  while (frontier.length > 0) {
    const children = await db
      .select({ id: folders.id })
      .from(folders)
      .where(inArray(folders.parentId, frontier));
    const childIds = children.map((f) => f.id);
    allFolderIds.push(...childIds);
    frontier = childIds;
  }

  // Find all files in these folders
  const pluginFiles = await db
    .select({
      id: files.id,
      storagePath: files.storagePath,
      size: files.size,
    })
    .from(files)
    .where(inArray(files.folderId, allFolderIds));

  for (const file of pluginFiles) {
    await deleteFileEverywhere({
      db,
      workspaceId,
      fileId: file.id,
    }).catch(() => {});
  }

  // Delete folder records (children first, then plugin folder)
  for (const folderId of allFolderIds.reverse()) {
    await db.delete(folders).where(eq(folders.id, folderId));
  }

  // Evict cache
  folderCache.delete(`${workspaceId}:${pluginSlug}`);

  invalidateWorkspaceVfsSnapshot(workspaceId);
}
