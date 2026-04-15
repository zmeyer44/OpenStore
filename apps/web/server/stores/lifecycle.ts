import { and, eq, sql } from "drizzle-orm";
import {
  blobLocations,
  fileBlobs,
  files,
  fileTranscriptions,
  ingestTombstones,
  stores,
  workspaces,
} from "@locker/database";
import type { Database } from "@locker/database";
import {
  createStorageForFile,
  getActiveStores,
  getFileLocationContext,
  getFileStoragePath,
  getPrimaryStore,
  getStoreById,
} from "../storage";
import { resolvePluginEndpoint } from "../plugins/resolve-endpoint";
import { qmdClient, streamToString } from "../plugins/handlers/qmd-client";
import { ftsClient } from "../plugins/handlers/fts-client";
import { invalidateWorkspaceVfsSnapshot } from "../vfs/locker-vfs";
import { isTextIndexable, transcribeFile } from "../plugins/transcription";
import { syncFileToStores } from "./sync";
import { makeWebFileSourceResolver } from "../storage";

export async function runFileReadyHooks(params: {
  db: Database;
  workspaceId: string;
  userId: string;
  fileId: string;
}) {
  const [file] = await params.db
    .select({
      id: files.id,
      name: files.name,
      mimeType: files.mimeType,
    })
    .from(files)
    .where(
      and(eq(files.id, params.fileId), eq(files.workspaceId, params.workspaceId)),
    )
    .limit(1);

  if (!file) return;

  const storesForWorkspace = await getActiveStores(params.workspaceId);
  const writableReplicaExists =
    storesForWorkspace.filter((store) => store.writeMode === "write").length > 1;

  const getContent = async () => {
    const { storage, storagePath } = await getFileLocationContext(file.id);
    const { data } = await storage.download(storagePath);
    return streamToString(data);
  };

  if (qmdClient.shouldIndex(file.mimeType)) {
    void (async () => {
      try {
        const endpoint = await resolvePluginEndpoint(
          params.db,
          params.workspaceId,
          "qmd-search",
          {
            serviceUrl: process.env.QMD_SERVICE_URL,
            apiSecret: process.env.QMD_API_SECRET,
          },
        );
        if (!endpoint) return;
        const content = await getContent();
        await qmdClient.indexFile(
          {
            workspaceId: params.workspaceId,
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            content,
          },
          endpoint,
        );
      } catch {}
    })();
  }

  if (ftsClient.shouldIndex(file.mimeType)) {
    void (async () => {
      try {
        const endpoint = await resolvePluginEndpoint(
          params.db,
          params.workspaceId,
          "fts-search",
          {
            serviceUrl: process.env.FTS_SERVICE_URL,
            apiSecret: process.env.FTS_API_SECRET,
          },
        );
        if (!endpoint) return;
        const content = await getContent();
        await ftsClient.indexFile(
          {
            workspaceId: params.workspaceId,
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            content,
          },
          endpoint,
        );
      } catch {}
    })();
  }

  if (!isTextIndexable(file.mimeType)) {
    void transcribeFile({
      db: params.db,
      workspaceId: params.workspaceId,
      userId: params.userId,
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
    }).catch(() => {});
  }

  if (writableReplicaExists) {
    void syncFileToStores({ db: params.db, fileId: file.id, resolveFileSource: makeWebFileSourceResolver() }).catch(() => {});
  }
}

async function deindexFile(params: {
  db: Database;
  workspaceId: string;
  fileId: string;
}) {
  const qmdEndpoint = await resolvePluginEndpoint(
    params.db,
    params.workspaceId,
    "qmd-search",
    {
      serviceUrl: process.env.QMD_SERVICE_URL,
      apiSecret: process.env.QMD_API_SECRET,
    },
  );
  const ftsEndpoint = await resolvePluginEndpoint(
    params.db,
    params.workspaceId,
    "fts-search",
    {
      serviceUrl: process.env.FTS_SERVICE_URL,
      apiSecret: process.env.FTS_API_SECRET,
    },
  );

  await Promise.allSettled([
    qmdEndpoint
      ? qmdClient.deindexFile(
          { workspaceId: params.workspaceId, fileId: params.fileId },
          qmdEndpoint,
        )
      : Promise.resolve(),
    ftsEndpoint
      ? ftsClient.deindexFile(
          { workspaceId: params.workspaceId, fileId: params.fileId },
          ftsEndpoint,
        )
      : Promise.resolve(),
  ]);
}

export type BlobLocationInfo = {
  storeId: string;
  storagePath: string;
  writeMode: string;
};

/**
 * Read blob locations for a file. Call this BEFORE deleting DB records,
 * since cascade deletes will remove blobLocations rows.
 */
export async function readBlobLocations(
  db: Database,
  blobId: string,
): Promise<BlobLocationInfo[]> {
  return db
    .select({
      storeId: blobLocations.storeId,
      storagePath: blobLocations.storagePath,
      writeMode: stores.writeMode,
    })
    .from(blobLocations)
    .innerJoin(stores, eq(blobLocations.storeId, stores.id))
    .where(eq(blobLocations.blobId, blobId));
}

/**
 * Best-effort cleanup of a file's external resources (storage objects and
 * search indexes). Does NOT touch the database — call this after the DB
 * records have already been deleted.
 *
 * `locations` must be fetched BEFORE the DB records are deleted (cascade
 * from fileBlobs removes blobLocations rows).
 */
export async function cleanupFileExternalResources(params: {
  db: Database;
  workspaceId: string;
  fileId: string;
  blobId: string;
  storagePath: string;
  locations: BlobLocationInfo[];
  deletedByUserId?: string;
}) {
  const { locations } = params;

  if (locations.length === 0 && params.storagePath) {
    try {
      const primary = await getPrimaryStore(params.workspaceId);
      await primary.storage.delete(params.storagePath);
    } catch {
      // best-effort
    }
  }

  for (const location of locations) {
    if (location.writeMode === "read_only") {
      await params.db
        .insert(ingestTombstones)
        .values({
          workspaceId: params.workspaceId,
          storeId: location.storeId,
          externalPath: location.storagePath,
          deletedBlobId: params.blobId,
          deletedByUserId: params.deletedByUserId ?? null,
        })
        .onConflictDoNothing();
      continue;
    }

    try {
      const { storage } = await getStoreById(location.storeId);
      await storage.delete(location.storagePath);
    } catch {
      // best-effort
    }
  }

  await deindexFile({
    db: params.db,
    workspaceId: params.workspaceId,
    fileId: params.fileId,
  });
}

export async function deleteFileEverywhere(params: {
  db: Database;
  workspaceId: string;
  fileId: string;
  deletedByUserId?: string;
}) {
  const [file] = await params.db
    .select({
      id: files.id,
      blobId: files.blobId,
      name: files.name,
      size: files.size,
      storagePath: files.storagePath,
    })
    .from(files)
    .where(
      and(eq(files.id, params.fileId), eq(files.workspaceId, params.workspaceId)),
    )
    .limit(1);

  if (!file) return null;

  const locations = await params.db
    .select({
      storeId: blobLocations.storeId,
      storagePath: blobLocations.storagePath,
      writeMode: stores.writeMode,
    })
    .from(blobLocations)
    .innerJoin(stores, eq(blobLocations.storeId, stores.id))
    .where(eq(blobLocations.blobId, file.blobId));

  if (locations.length === 0 && file.storagePath) {
    // Pre-migration platform files may have no blob_locations yet.
    try {
      const primary = await getPrimaryStore(params.workspaceId);
      await primary.storage.delete(file.storagePath);
    } catch {
      // best-effort
    }
  }

  for (const location of locations) {
    if (location.writeMode === "read_only") {
      await params.db
        .insert(ingestTombstones)
        .values({
          workspaceId: params.workspaceId,
          storeId: location.storeId,
          externalPath: location.storagePath,
          deletedBlobId: file.blobId,
          deletedByUserId: params.deletedByUserId ?? null,
        })
        .onConflictDoNothing();
      continue;
    }

    try {
      const { storage } = await getStoreById(location.storeId);
      await storage.delete(location.storagePath);
    } catch {
      // Storage cleanup is best-effort. DB deletion is authoritative.
    }
  }

  await deindexFile({
    db: params.db,
    workspaceId: params.workspaceId,
    fileId: file.id,
  });

  await params.db.transaction(async (tx) => {
    await tx
      .delete(fileTranscriptions)
      .where(eq(fileTranscriptions.fileId, file.id));
    await tx.delete(files).where(eq(files.id, file.id));
    await tx.delete(fileBlobs).where(eq(fileBlobs.id, file.blobId));
    await tx
      .update(workspaces)
      .set({
        storageUsed: sql`GREATEST(${workspaces.storageUsed} - ${file.size}, 0)`,
      })
      .where(eq(workspaces.id, params.workspaceId));
  });

  invalidateWorkspaceVfsSnapshot(params.workspaceId);
  return file;
}
