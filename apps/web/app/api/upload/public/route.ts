import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@locker/database/client";
import { files, uploadLinks, workspaces } from "@locker/database";
import {
  createStorageForWorkspace,
  shouldEnforceQuota,
} from "../../../../server/storage";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { verifyLinkPassword } from "@/server/security/password";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const token = formData.get("token") as string | null;
  const password = formData.get("password") as string | null;

  if (!file || !token) {
    return NextResponse.json(
      { error: "Missing file or token" },
      { status: 400 },
    );
  }

  const db = getDb();

  // Validate upload link
  const [link] = await db
    .select()
    .from(uploadLinks)
    .where(eq(uploadLinks.token, token));

  if (!link || !link.isActive) {
    return NextResponse.json(
      { error: "Upload link not found" },
      { status: 404 },
    );
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Upload link expired" }, { status: 410 });
  }

  if (link.maxFiles && link.filesUploaded >= link.maxFiles) {
    return NextResponse.json(
      { error: "Upload limit reached" },
      { status: 429 },
    );
  }

  if (link.hasPassword) {
    if (!verifyLinkPassword(password ?? undefined, link.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 },
      );
    }
  }

  if (link.maxFileSize && file.size > link.maxFileSize) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  if (link.allowedMimeTypes && !link.allowedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 415 },
    );
  }

  // Check workspace storage quota (skipped for BYOB and self-hosted/local)
  if (await shouldEnforceQuota(link.workspaceId)) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, link.workspaceId));

    if (
      !workspace ||
      (workspace.storageUsed ?? 0) + file.size > (workspace.storageLimit ?? 0)
    ) {
      return NextResponse.json(
        { error: "Storage quota exceeded" },
        { status: 507 },
      );
    }
  }

  const { storage, configId, providerName } = await createStorageForWorkspace(
    link.workspaceId,
  );
  const fileId = randomUUID();
  const storagePath = `${link.workspaceId}/${fileId}/${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await storage.upload({
    path: storagePath,
    data: buffer,
    contentType: file.type || "application/octet-stream",
  });

  await db.insert(files).values({
    id: fileId,
    workspaceId: link.workspaceId,
    userId: link.userId,
    folderId: link.folderId ?? null,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    storagePath,
    storageProvider: providerName,
    storageConfigId: configId,
    status: "ready",
  });

  // Update counts
  await db
    .update(uploadLinks)
    .set({ filesUploaded: sql`${uploadLinks.filesUploaded} + 1` })
    .where(eq(uploadLinks.id, link.id));

  await db
    .update(workspaces)
    .set({ storageUsed: sql`${workspaces.storageUsed} + ${file.size}` })
    .where(eq(workspaces.id, link.workspaceId));

  return NextResponse.json({ success: true });
}
