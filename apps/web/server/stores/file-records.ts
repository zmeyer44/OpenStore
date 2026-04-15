import { randomUUID } from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  blobLocations,
  fileBlobs,
  files,
  fileTranscriptions,
  workspaces,
  type Database,
} from "@locker/database";
import {
  buildFolderPath,
  buildStoreTargetPath,
  deduplicateObjectKey,
} from "@locker/jobs";
import { createStorageForWorkspace } from "../storage";

export async function createPendingFileUpload(params: {
  db: Database;
  workspaceId: string;
  userId: string;
  folderId: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  status?: "uploading" | "ready";
  fileId?: string;
  blobId?: string;
  s3Key?: string | null;
  overwrite?: boolean;
  replacesFileId?: string | null;
}) {
  const { db, workspaceId, userId } = params;
  const fileId = params.fileId ?? randomUUID();
  const blobId = params.blobId ?? randomUUID();

  const displayPath = await buildFolderPath(db, workspaceId, {
    name: params.fileName,
    folderId: params.folderId,
  });

  const primary = await createStorageForWorkspace(workspaceId);

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const objectKey = await deduplicateObjectKey(
          tx,
          workspaceId,
          displayPath,
          params.overwrite ?? false,
        );

        // Derive display name from the (possibly deduplicated) objectKey
        // so "keep both" files show "report (1).pdf" instead of duplicate "report.pdf"
        const resolvedFileName = objectKey.split("/").pop() ?? params.fileName;

        const storagePath = buildStoreTargetPath(
          primary.store,
          workspaceId,
          objectKey,
        );

        // Remove stale (failed/deleted) blobs that hold this key in the
        // unique index. Cascades to blob_locations and files.
        await tx.delete(fileBlobs).where(
          and(
            eq(fileBlobs.workspaceId, workspaceId),
            eq(fileBlobs.objectKey, objectKey),
            inArray(fileBlobs.state, ["failed", "deleted"]),
          ),
        );

        await tx.insert(fileBlobs).values({
          id: blobId,
          workspaceId,
          createdById: userId,
          objectKey,
          byteSize: params.size,
          mimeType: params.mimeType,
          state: params.status === "ready" ? "ready" : "pending",
        });

        await tx.insert(blobLocations).values({
          blobId,
          storeId: primary.storeId,
          storagePath,
          state: params.status === "ready" ? "available" : "pending",
          origin: "primary_upload",
        });

        await tx.insert(files).values({
          id: fileId,
          workspaceId,
          userId,
          folderId: params.folderId,
          blobId,
          name: resolvedFileName,
          mimeType: params.mimeType,
          size: params.size,
          storagePath,
          storageProvider: primary.providerName,
          status: params.status ?? "uploading",
          s3Key: params.s3Key ?? null,
          replacesFileId: params.replacesFileId ?? null,
        });

        return {
          fileId,
          blobId,
          objectKey,
          storagePath,
          storeId: primary.storeId,
          providerName: primary.providerName,
          storage: primary.storage,
        };
      });
    } catch (err: unknown) {
      const code = err instanceof Error && "code" in err
        ? (err as Error & { code: string }).code
        : undefined;
      if (code === "23505" && attempt < MAX_RETRIES) continue;
      throw err;
    }
  }

  throw new Error("Exhausted retries for createPendingFileUpload");
}

export async function markFileUploadReady(params: {
  db: Database;
  fileId: string;
}) {
  const { db, fileId } = params;
  const [file] = await db
    .select({
      blobId: files.blobId,
      storagePath: files.storagePath,
    })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  if (!file) {
    throw new Error("File not found");
  }

  await db
    .update(files)
    .set({ status: "ready", updatedAt: new Date() })
    .where(eq(files.id, fileId));

  await db
    .update(fileBlobs)
    .set({ state: "ready", updatedAt: new Date() })
    .where(eq(fileBlobs.id, file.blobId));

  await db
    .update(blobLocations)
    .set({
      state: "available",
      lastVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(blobLocations.blobId, file.blobId));
}

/**
 * Atomically complete a replace upload: delete old file records, rename the
 * new file to the original name, and mark it ready — all in one transaction.
 *
 * Returns the old file's blob info so the caller can do external cleanup
 * (storage deletion, de-indexing) after the commit.
 */
export async function finalizeReplace(params: {
  db: Database;
  workspaceId: string;
  newFileId: string;
  replacedFileId: string;
}) {
  const { db, workspaceId, newFileId, replacedFileId } = params;

  // Read both file records before the transaction
  const [newFile] = await db
    .select({ blobId: files.blobId })
    .from(files)
    .where(eq(files.id, newFileId))
    .limit(1);

  const [oldFile] = await db
    .select({
      id: files.id,
      blobId: files.blobId,
      name: files.name,
      size: files.size,
      storagePath: files.storagePath,
    })
    .from(files)
    .where(and(eq(files.id, replacedFileId), eq(files.workspaceId, workspaceId)))
    .limit(1);

  if (!newFile || !oldFile) {
    // Old file already gone (race) — just mark ready as normal
    if (newFile) {
      await markFileUploadReady({ db, fileId: newFileId });
    }
    return null;
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    // Delete old file records
    await tx.delete(fileTranscriptions).where(eq(fileTranscriptions.fileId, oldFile.id));
    await tx.delete(files).where(eq(files.id, oldFile.id));
    await tx.delete(fileBlobs).where(eq(fileBlobs.id, oldFile.blobId));

    // Adjust storage for removed file
    await tx
      .update(workspaces)
      .set({ storageUsed: sql`GREATEST(${workspaces.storageUsed} - ${oldFile.size}, 0)` })
      .where(eq(workspaces.id, workspaceId));

    // Rename new file to original name + mark ready in the same transaction
    await tx
      .update(files)
      .set({ name: oldFile.name, status: "ready", replacesFileId: null, updatedAt: now })
      .where(eq(files.id, newFileId));

    await tx
      .update(fileBlobs)
      .set({ state: "ready", updatedAt: now })
      .where(eq(fileBlobs.id, newFile.blobId));

    await tx
      .update(blobLocations)
      .set({ state: "available", lastVerifiedAt: now, updatedAt: now })
      .where(eq(blobLocations.blobId, newFile.blobId));
  });

  // Return old file info for external cleanup (storage + index)
  return oldFile;
}

export async function markBlobLocationFailed(params: {
  db: Database;
  blobId: string;
  errorMessage: string;
}) {
  await params.db
    .update(blobLocations)
    .set({
      state: "failed",
      lastError: params.errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(blobLocations.blobId, params.blobId));

  await params.db
    .update(fileBlobs)
    .set({ state: "failed", updatedAt: new Date() })
    .where(eq(fileBlobs.id, params.blobId));
}
