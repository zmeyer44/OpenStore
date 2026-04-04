import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../server/auth";
import { headers } from "next/headers";
import { getDb } from "@locker/database/client";
import { files, workspaces, workspaceMembers } from "@locker/database";
import {
  createStorageForFile,
  shouldEnforceQuotaForConfig,
} from "../../../../server/storage";
import { eq, and, sql } from "drizzle-orm";
import { invalidateWorkspaceVfsSnapshot } from "../../../../server/vfs/locker-vfs";

export const runtime = "nodejs";

// Disable body parser — we stream the raw request body
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read metadata from headers instead of FormData
  const reqHeaders = await headers();
  const fileId = reqHeaders.get("x-file-id");
  const workspaceSlug = reqHeaders.get("x-workspace-slug");
  const contentType =
    req.headers.get("content-type") ?? "application/octet-stream";
  const contentLengthHeader = req.headers.get("content-length");

  if (!fileId || !workspaceSlug) {
    return NextResponse.json(
      { error: "Missing x-file-id or x-workspace-slug headers" },
      { status: 400 },
    );
  }

  if (!req.body) {
    return NextResponse.json({ error: "No body" }, { status: 400 });
  }

  const contentLength = Number.parseInt(contentLengthHeader ?? "", 10);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return NextResponse.json(
      { error: "Missing or invalid content-length header" },
      { status: 400 },
    );
  }

  const db = getDb();
  const userId = session.user.id;

  // Verify workspace membership
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

  // Verify the file record exists and belongs to this workspace
  const [fileRecord] = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.id, fileId),
        eq(files.workspaceId, membership.workspaceId),
        eq(files.status, "uploading"),
      ),
    );

  if (!fileRecord) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  if (fileRecord.size !== contentLength) {
    return NextResponse.json(
      { error: "Content length does not match initiated upload size" },
      { status: 400 },
    );
  }

  // Enforce quota based on where bytes actually land (the file's config),
  // not the workspace's current config which may have changed since initiate.
  if (
    await shouldEnforceQuotaForConfig(
      membership.workspaceId,
      fileRecord.storageConfigId,
    )
  ) {
    if (
      (membership.storageUsed ?? 0) + contentLength >
      (membership.storageLimit ?? 0)
    ) {
      return NextResponse.json(
        { error: "Storage quota exceeded" },
        { status: 507 },
      );
    }
  }

  // Stream the request body to storage
  // Use the config that was recorded when the upload was initiated
  const storage = await createStorageForFile(fileRecord.storageConfigId);

  try {
    await storage.upload({
      path: fileRecord.storagePath,
      data: req.body as unknown as ReadableStream,
      contentType,
    });

    // Mark file as ready
    await db
      .update(files)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(files.id, fileId));

    // Update storage usage
    await db
      .update(workspaces)
      .set({
        storageUsed: sql`${workspaces.storageUsed} + ${contentLength}`,
      })
      .where(eq(workspaces.id, membership.workspaceId));

    invalidateWorkspaceVfsSnapshot(membership.workspaceId);
    return NextResponse.json({ success: true, fileId });
  } catch (err) {
    // Clean up on failure
    try {
      await storage.delete(fileRecord.storagePath);
    } catch {
      // best effort
    }
    await db.delete(files).where(eq(files.id, fileId));
    invalidateWorkspaceVfsSnapshot(membership.workspaceId);

    return NextResponse.json(
      { error: (err as Error).message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
