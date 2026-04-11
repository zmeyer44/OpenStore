import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../server/auth";
import { headers } from "next/headers";
import { getDb } from "@locker/database/client";
import {
  fileBlobs,
  files,
  folders,
  workspaces,
  workspaceMembers,
} from "@locker/database";
import {
  createStorageForFile,
  shouldEnforceQuota,
  shouldEnforceQuotaForFile,
} from "../../../server/storage";
import { MAX_FILE_SIZE } from "@locker/common";
import { eq, and, sql } from "drizzle-orm";
import { invalidateWorkspaceVfsSnapshot } from "../../../server/vfs/locker-vfs";
import {
  createPendingFileUpload,
  markFileUploadReady,
} from "../../../server/stores/file-records";
import { runFileReadyHooks } from "../../../server/stores/lifecycle";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string | null;
  const existingFileId = formData.get("fileId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const db = getDb();
  const userId = session.user.id;

  // Resolve workspace from header
  const reqHeaders = await headers();
  const workspaceSlug = reqHeaders.get("x-workspace-slug");
  if (!workspaceSlug) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const [membership] = await db
    .select({
      workspaceId: workspaces.id,
      storageUsed: workspaces.storageUsed,
      storageLimit: workspaces.storageLimit,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaces.slug, workspaceSlug),
        eq(workspaceMembers.userId, userId),
      ),
    );

  if (!membership) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { workspaceId, storageUsed, storageLimit } = membership;

  // Validate folder belongs to workspace if provided
  if (folderId) {
    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(eq(folders.id, folderId), eq(folders.workspaceId, workspaceId)),
      );
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  let existingUploadRecord:
    | {
        id: string;
        blobId: string;
        size: number;
        storagePath: string;
        status: string;
      }
    | undefined;

  if (existingFileId) {
    const [uploadRecord] = await db
      .select({
        id: files.id,
        blobId: files.blobId,
        size: files.size,
        storagePath: files.storagePath,
        status: files.status,
      })
      .from(files)
      .where(
        and(eq(files.id, existingFileId), eq(files.workspaceId, workspaceId)),
      );

    if (!uploadRecord) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (uploadRecord.status !== "uploading") {
      return NextResponse.json(
        { error: "Upload has already been completed or aborted" },
        { status: 409 },
      );
    }

    if (uploadRecord.size !== file.size) {
      return NextResponse.json(
        { error: "File size does not match initiated upload" },
        { status: 400 },
      );
    }

    existingUploadRecord = uploadRecord;
  }

  // Check storage quota based on where bytes will actually land:
  // resumed uploads use the file's config, fresh uploads use current workspace config.
  const enforceQuota = existingUploadRecord
    ? await shouldEnforceQuotaForFile(existingUploadRecord.id)
    : await shouldEnforceQuota(workspaceId);

  if (enforceQuota) {
    if ((storageUsed ?? 0) + file.size > (storageLimit ?? 0)) {
      return NextResponse.json(
        { error: "Storage quota exceeded" },
        { status: 507 },
      );
    }
  }

  let pendingUpload:
    | Awaited<ReturnType<typeof createPendingFileUpload>>
    | undefined;

  const storage = existingUploadRecord
    ? await createStorageForFile(existingUploadRecord.id)
    : (
        (pendingUpload = await createPendingFileUpload({
          db,
          workspaceId,
          userId,
          folderId: folderId || null,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          status: "uploading",
        })),
        pendingUpload.storage
      );

  const fileId = existingUploadRecord?.id ?? pendingUpload!.fileId;
  const storagePath =
    existingUploadRecord?.storagePath ?? pendingUpload!.storagePath;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await storage.upload({
      path: storagePath,
      data: buffer,
      contentType: file.type || "application/octet-stream",
    });
  } catch (err) {
    if (!existingFileId && pendingUpload) {
      await db.transaction(async (tx) => {
        await tx.delete(files).where(eq(files.id, fileId));
        await tx.delete(fileBlobs).where(eq(fileBlobs.id, pendingUpload!.blobId));
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: `Storage upload failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  let newFile: typeof files.$inferSelect | undefined;
  if (existingFileId && existingUploadRecord) {
    await db
      .update(files)
      .set({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(files.id, existingFileId),
          eq(files.workspaceId, workspaceId),
          eq(files.status, "uploading"),
        ),
      );
    await db
      .update(fileBlobs)
      .set({
        byteSize: file.size,
        mimeType: file.type || "application/octet-stream",
        updatedAt: new Date(),
      })
      .where(eq(fileBlobs.id, existingUploadRecord.blobId));
  } else {
    await db
      .update(files)
      .set({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        updatedAt: new Date(),
      })
      .where(eq(files.id, fileId));
    await db
      .update(fileBlobs)
      .set({
        byteSize: file.size,
        mimeType: file.type || "application/octet-stream",
        updatedAt: new Date(),
      })
      .where(eq(fileBlobs.id, pendingUpload!.blobId));
  }

  await markFileUploadReady({ db, fileId });
  [newFile] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  // Update workspace storage usage
  const billedSize = existingUploadRecord?.size ?? file.size;
  await db
    .update(workspaces)
    .set({ storageUsed: sql`${workspaces.storageUsed} + ${billedSize}` })
    .where(eq(workspaces.id, workspaceId));

  if (newFile) {
    void runFileReadyHooks({
      db,
      workspaceId,
      userId,
      fileId: newFile.id,
    }).catch(() => {});
  }

  invalidateWorkspaceVfsSnapshot(workspaceId);
  return NextResponse.json({ file: newFile });
}
