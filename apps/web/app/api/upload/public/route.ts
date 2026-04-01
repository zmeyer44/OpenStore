import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@openstore/database/client';
import { files, uploadLinks, workspaces } from '@openstore/database';
import { createStorage } from '@openstore/storage';
import { eq, sql } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const token = formData.get('token') as string | null;
  const password = formData.get('password') as string | null;

  if (!file || !token) {
    return NextResponse.json({ error: 'Missing file or token' }, { status: 400 });
  }

  const db = getDb();

  // Validate upload link
  const [link] = await db
    .select()
    .from(uploadLinks)
    .where(eq(uploadLinks.token, token));

  if (!link || !link.isActive) {
    return NextResponse.json({ error: 'Upload link not found' }, { status: 404 });
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Upload link expired' }, { status: 410 });
  }

  if (link.maxFiles && link.filesUploaded >= link.maxFiles) {
    return NextResponse.json({ error: 'Upload limit reached' }, { status: 429 });
  }

  if (link.hasPassword) {
    if (!password || hashPassword(password) !== link.passwordHash) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }
  }

  if (link.maxFileSize && file.size > link.maxFileSize) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  if (link.allowedMimeTypes && !link.allowedMimeTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
  }

  // Check workspace storage quota
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, link.workspaceId));

  if (!workspace || (workspace.storageUsed ?? 0) + file.size > (workspace.storageLimit ?? 0)) {
    return NextResponse.json({ error: 'Storage quota exceeded' }, { status: 507 });
  }

  const storage = createStorage();
  const fileId = randomUUID();
  const storagePath = `${link.workspaceId}/${fileId}/${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await storage.upload({
    path: storagePath,
    data: buffer,
    contentType: file.type || 'application/octet-stream',
  });

  await db.insert(files).values({
    id: fileId,
    workspaceId: link.workspaceId,
    userId: link.userId,
    folderId: link.folderId ?? null,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    storagePath,
    storageProvider: process.env.BLOB_STORAGE_PROVIDER ?? 'local',
    status: 'ready',
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
