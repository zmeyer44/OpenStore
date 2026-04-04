import { NextRequest } from "next/server";
import { verifyLocalFileSignature } from "@locker/storage";
import { createStorageForFile } from "../../../../../server/storage";
import { getDb } from "@locker/database/client";
import { files } from "@locker/database";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ path: string[] }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const objectPath = path.join("/");

  const expiresParam = req.nextUrl.searchParams.get("exp");
  const signature = req.nextUrl.searchParams.get("sig");

  if (!objectPath || !expiresParam || !signature) {
    return new Response("Access denied", { status: 403 });
  }

  const expiresAt = Number.parseInt(expiresParam, 10);
  if (!Number.isFinite(expiresAt)) {
    return new Response("Access denied", { status: 403 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now) {
    return new Response("Link expired", { status: 410 });
  }

  if (!verifyLocalFileSignature(objectPath, expiresAt, signature)) {
    return new Response("Access denied", { status: 403 });
  }

  // Look up file record to determine which storage config it uses
  const db = getDb();
  const [fileRecord] = await db
    .select({ storageConfigId: files.storageConfigId })
    .from(files)
    .where(eq(files.storagePath, objectPath))
    .limit(1);

  const storage = await createStorageForFile(
    fileRecord?.storageConfigId ?? null,
  );

  try {
    const file = await storage.download(objectPath);
    return new Response(file.data, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.size),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
