import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import {
  blobLocations,
  fileBlobs,
  files,
  type Database,
} from "@locker/database";
import {
  buildStoragePathForStore,
  createStorageForWorkspace,
} from "../storage";

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
}) {
  const { db, workspaceId, userId } = params;
  const fileId = params.fileId ?? randomUUID();
  const blobId = params.blobId ?? randomUUID();
  const objectKey = `${workspaceId}/${blobId}/${params.fileName}`;
  const primary = await createStorageForWorkspace(workspaceId);
  const storagePath = buildStoragePathForStore(primary.store, objectKey);

  await db.insert(fileBlobs).values({
    id: blobId,
    workspaceId,
    createdById: userId,
    objectKey,
    byteSize: params.size,
    mimeType: params.mimeType,
    state: params.status === "ready" ? "ready" : "pending",
  });

  await db.insert(blobLocations).values({
    blobId,
    storeId: primary.storeId,
    storagePath,
    state: params.status === "ready" ? "available" : "pending",
    origin: "primary_upload",
  });

  await db.insert(files).values({
    id: fileId,
    workspaceId,
    userId,
    folderId: params.folderId,
    blobId,
    name: params.fileName,
    mimeType: params.mimeType,
    size: params.size,
    storagePath,
    storageProvider: primary.providerName,
    status: params.status ?? "uploading",
    s3Key: params.s3Key ?? null,
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
