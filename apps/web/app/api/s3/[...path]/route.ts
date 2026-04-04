import { NextRequest } from "next/server";
import { createHash, randomUUID } from "crypto";
import { verifySignatureV4 } from "@/server/s3/auth";
import {
  accessDenied,
  noSuchBucket,
  noSuchKey,
  invalidRequest,
  internalError,
  quotaExceeded,
  noSuchUpload,
} from "@/server/s3/errors";
import {
  xmlResponse,
  listObjectsV2Xml,
  initiateMultipartUploadXml,
  completeMultipartUploadXml,
} from "@/server/s3/xml";
import {
  parseS3Key,
  resolveOrCreateFolderChain,
  buildS3KeyForFile,
} from "@/server/s3/paths";
import { getDb } from "@locker/database/client";
import {
  files,
  workspaces,
  s3MultipartUploads,
  s3MultipartParts,
} from "@locker/database";
import {
  createStorageForWorkspace,
  createStorageForFile,
  shouldEnforceQuota,
} from "../../../../server/storage";
import { eq, and, like, sql, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parsePath(params: string[]): { slug: string; key: string } {
  const [slug, ...rest] = params;
  return { slug: slug ?? "", key: rest.join("/") };
}

type AuthResult = {
  workspaceId: string;
  workspaceSlug: string;
  keyId: string;
  userId: string;
  permissions: string;
};

async function authenticate(req: NextRequest): Promise<AuthResult | null> {
  return verifySignatureV4(req);
}

async function verifyBucket(
  db: ReturnType<typeof getDb>,
  auth: AuthResult,
  slug: string,
) {
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, auth.workspaceId));
  if (!ws || ws.slug !== slug) return null;
  return ws;
}

// ── GET: GetObject or ListObjectsV2 ────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const { slug, key } = parsePath(path);

  const auth = await authenticate(req);
  if (!auth) return accessDenied();

  const db = getDb();
  const ws = await verifyBucket(db, auth, slug);
  if (!ws) return noSuchBucket(slug);

  if (!key || req.nextUrl.searchParams.has("list-type")) {
    return handleListObjects(req, db, auth.workspaceId, slug);
  }

  const [file] = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.workspaceId, auth.workspaceId),
        eq(files.s3Key, key),
        eq(files.status, "ready"),
      ),
    );
  if (!file) return noSuchKey(key);

  try {
    const storage = await createStorageForFile(file.storageConfigId);
    const result = await storage.download(file.storagePath);
    return new Response(result.data as any, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        ETag: `"${file.checksum ?? file.id}"`,
        "Last-Modified": file.updatedAt.toUTCString(),
      },
    });
  } catch {
    return internalError("Failed to read object");
  }
}

// ── PUT: PutObject or UploadPart ────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const { slug, key } = parsePath(path);
  if (!key) return invalidRequest("Object key is required");

  const auth = await authenticate(req);
  if (!auth) return accessDenied();
  if (auth.permissions === "readonly") return accessDenied();

  const db = getDb();
  const ws = await verifyBucket(db, auth, slug);
  if (!ws) return noSuchBucket(slug);

  // UploadPart if partNumber + uploadId present
  const partNumber = req.nextUrl.searchParams.get("partNumber");
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (partNumber && uploadId) {
    const parsedPartNumber = Number.parseInt(partNumber, 10);
    if (!Number.isInteger(parsedPartNumber) || parsedPartNumber < 1) {
      return invalidRequest("Invalid part number");
    }
    return handleUploadPart(req, db, auth, key, uploadId, parsedPartNumber);
  }

  // PutObject
  return handlePutObject(req, db, auth, ws, key);
}

// ── DELETE: DeleteObject or AbortMultipartUpload ────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const { slug, key } = parsePath(path);
  if (!key) return invalidRequest("Object key is required");

  const auth = await authenticate(req);
  if (!auth) return accessDenied();
  if (auth.permissions === "readonly") return accessDenied();

  const db = getDb();
  const ws = await verifyBucket(db, auth, slug);
  if (!ws) return noSuchBucket(slug);

  // AbortMultipartUpload
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (uploadId) {
    return handleAbortMultipart(db, auth, uploadId);
  }

  // DeleteObject
  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.workspaceId, auth.workspaceId), eq(files.s3Key, key)));

  if (file) {
    try {
      const storage = await createStorageForFile(file.storageConfigId);
      await storage.delete(file.storagePath);
    } catch {
      /* best effort */
    }
    await db.delete(files).where(eq(files.id, file.id));
    await db
      .update(workspaces)
      .set({
        storageUsed: sql`GREATEST(${workspaces.storageUsed} - ${file.size}, 0)`,
      })
      .where(eq(workspaces.id, auth.workspaceId));
  }

  return new Response(null, { status: 204 });
}

// ── HEAD: HeadObject or HeadBucket ──────────────────────────────────────

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const { slug, key } = parsePath(path);

  const auth = await authenticate(req);
  if (!auth) return accessDenied();

  const db = getDb();
  const ws = await verifyBucket(db, auth, slug);
  if (!ws) return noSuchBucket(slug);

  if (!key) {
    return new Response(null, {
      status: 200,
      headers: { "x-amz-bucket-region": "us-east-1" },
    });
  }

  const [file] = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.workspaceId, auth.workspaceId),
        eq(files.s3Key, key),
        eq(files.status, "ready"),
      ),
    );
  if (!file) return noSuchKey(key);

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      ETag: `"${file.checksum ?? file.id}"`,
      "Last-Modified": file.updatedAt.toUTCString(),
    },
  });
}

// ── POST: CreateMultipartUpload or CompleteMultipartUpload ───────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const { slug, key } = parsePath(path);
  if (!key) return invalidRequest("Object key is required");

  const auth = await authenticate(req);
  if (!auth) return accessDenied();
  if (auth.permissions === "readonly") return accessDenied();

  const db = getDb();
  const ws = await verifyBucket(db, auth, slug);
  if (!ws) return noSuchBucket(slug);

  // CreateMultipartUpload: POST /{slug}/{key}?uploads
  if (req.nextUrl.searchParams.has("uploads")) {
    return handleCreateMultipart(
      db,
      auth,
      slug,
      key,
      req.headers.get("content-type") ?? "application/octet-stream",
    );
  }

  // CompleteMultipartUpload: POST /{slug}/{key}?uploadId=X
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (uploadId) {
    return handleCompleteMultipart(req, db, auth, ws, slug, key, uploadId);
  }

  return invalidRequest("Unsupported POST operation");
}

// ── Operation handlers ──────────────────────────────────────────────────

async function handlePutObject(
  req: NextRequest,
  db: ReturnType<typeof getDb>,
  auth: AuthResult,
  ws: typeof workspaces.$inferSelect,
  key: string,
): Promise<Response> {
  const contentLength = Number.parseInt(
    req.headers.get("content-length") ?? "",
    10,
  );
  const contentType =
    req.headers.get("content-type") ?? "application/octet-stream";

  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return invalidRequest("Invalid content length");
  }
  if (!req.body) return invalidRequest("Request body is required");

  const { dirSegments, fileName } = parseS3Key(key);
  if (!fileName) return invalidRequest("Object key must include a file name");

  try {
    const [existing] = await db
      .select({
        id: files.id,
        size: files.size,
        storagePath: files.storagePath,
        storageConfigId: files.storageConfigId,
      })
      .from(files)
      .where(
        and(eq(files.workspaceId, auth.workspaceId), eq(files.s3Key, key)),
      );

    const projectedUsed =
      (ws.storageUsed ?? 0) - (existing?.size ?? 0) + contentLength;
    if (
      (await shouldEnforceQuota(auth.workspaceId)) &&
      projectedUsed > (ws.storageLimit ?? 0)
    )
      return quotaExceeded();

    const folderId = await resolveOrCreateFolderChain(
      db,
      auth.workspaceId,
      auth.userId,
      dirSegments,
    );

    const { storage, configId, providerName } = await createStorageForWorkspace(
      auth.workspaceId,
    );
    const fileId = existing?.id ?? randomUUID();
    const storagePath =
      existing?.storagePath ?? `${auth.workspaceId}/${fileId}/${fileName}`;

    await storage.upload({
      path: storagePath,
      data: req.body as unknown as ReadableStream,
      contentType,
    });

    if (existing) {
      // If the config changed, clean up old data from the previous backend
      if (existing.storageConfigId !== configId) {
        try {
          const oldStorage = await createStorageForFile(
            existing.storageConfigId,
          );
          await oldStorage.delete(existing.storagePath);
        } catch {
          /* best effort */
        }
      }

      await db
        .update(files)
        .set({
          size: contentLength,
          mimeType: contentType,
          storagePath,
          storageProvider: providerName,
          storageConfigId: configId,
          updatedAt: new Date(),
        })
        .where(eq(files.id, existing.id));
      const sizeDiff = contentLength - existing.size;
      if (sizeDiff !== 0) {
        await db
          .update(workspaces)
          .set({
            storageUsed: sql`GREATEST(${workspaces.storageUsed} + ${sizeDiff}, 0)`,
          })
          .where(eq(workspaces.id, auth.workspaceId));
      }
    } else {
      await db.insert(files).values({
        id: fileId,
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        folderId,
        name: fileName,
        mimeType: contentType,
        size: contentLength,
        storagePath,
        storageProvider: providerName,
        storageConfigId: configId,
        status: "ready",
        s3Key: key,
      });
      await db
        .update(workspaces)
        .set({ storageUsed: sql`${workspaces.storageUsed} + ${contentLength}` })
        .where(eq(workspaces.id, auth.workspaceId));
    }

    return new Response(null, {
      status: 200,
      headers: { ETag: `"${fileId}"` },
    });
  } catch (err) {
    return internalError((err as Error).message);
  }
}

async function handleCreateMultipart(
  db: ReturnType<typeof getDb>,
  auth: AuthResult,
  bucket: string,
  key: string,
  contentType: string,
): Promise<Response> {
  const uploadId = randomUUID();
  const { fileName } = parseS3Key(key);
  const fileId = randomUUID();
  const storagePath = `${auth.workspaceId}/${fileId}/${fileName}`;

  await db.insert(s3MultipartUploads).values({
    workspaceId: auth.workspaceId,
    uploadId,
    s3Key: key,
    storagePath,
    contentType,
    userId: auth.userId,
    status: "in_progress",
  });

  return xmlResponse(initiateMultipartUploadXml(bucket, key, uploadId));
}

async function handleUploadPart(
  req: NextRequest,
  db: ReturnType<typeof getDb>,
  auth: AuthResult,
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<Response> {
  // Verify the multipart upload exists
  const [upload] = await db
    .select()
    .from(s3MultipartUploads)
    .where(
      and(
        eq(s3MultipartUploads.uploadId, uploadId),
        eq(s3MultipartUploads.workspaceId, auth.workspaceId),
        eq(s3MultipartUploads.status, "in_progress"),
      ),
    );

  if (!upload) return noSuchUpload();
  if (upload.s3Key !== key) return invalidRequest("Upload key mismatch");
  if (!req.body) return invalidRequest("Request body is required");

  const contentLength = Number.parseInt(
    req.headers.get("content-length") ?? "",
    10,
  );
  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return invalidRequest("Invalid content length");
  }

  // Store the part in storage with a part-specific path
  const partPath = `${upload.storagePath}.part${partNumber}`;
  const { storage } = await createStorageForWorkspace(auth.workspaceId);

  try {
    await storage.upload({
      path: partPath,
      data: req.body as unknown as ReadableStream,
      contentType: "application/octet-stream",
    });

    // Generate ETag from part number + upload ID
    const etag = createHash("md5")
      .update(`${uploadId}-${partNumber}`)
      .digest("hex");

    // Upsert the part record
    await db
      .insert(s3MultipartParts)
      .values({
        uploadId,
        partNumber,
        storagePath: partPath,
        size: contentLength,
        etag,
      })
      .onConflictDoUpdate({
        target: [s3MultipartParts.uploadId, s3MultipartParts.partNumber],
        set: { storagePath: partPath, size: contentLength, etag },
      });

    return new Response(null, {
      status: 200,
      headers: { ETag: `"${etag}"` },
    });
  } catch (err) {
    return internalError((err as Error).message);
  }
}

function createMultipartObjectStream(
  storage: import("@locker/storage").StorageProvider,
  parts: Array<{ storagePath: string }>,
): ReadableStream<Uint8Array> {
  let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let currentIndex = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        if (!currentReader) {
          if (currentIndex >= parts.length) {
            controller.close();
            return;
          }

          const partResult = await storage.download(
            parts[currentIndex]!.storagePath,
          );
          currentReader = (
            partResult.data as ReadableStream<Uint8Array>
          ).getReader();
          currentIndex += 1;
        }

        const { done, value } = await currentReader.read();

        if (done) {
          currentReader.releaseLock();
          currentReader = null;
          continue;
        }

        if (value) {
          controller.enqueue(value);
          return;
        }
      }
    },
    async cancel(reason) {
      if (currentReader) {
        await currentReader.cancel(reason);
      }
    },
  });
}

async function handleCompleteMultipart(
  req: NextRequest,
  db: ReturnType<typeof getDb>,
  auth: AuthResult,
  ws: typeof workspaces.$inferSelect,
  bucket: string,
  key: string,
  uploadId: string,
): Promise<Response> {
  const [upload] = await db
    .select()
    .from(s3MultipartUploads)
    .where(
      and(
        eq(s3MultipartUploads.uploadId, uploadId),
        eq(s3MultipartUploads.workspaceId, auth.workspaceId),
        eq(s3MultipartUploads.status, "in_progress"),
      ),
    );

  if (!upload) return noSuchUpload();
  if (upload.s3Key !== key) return invalidRequest("Upload key mismatch");

  // Get all parts sorted by part number
  const parts = await db
    .select()
    .from(s3MultipartParts)
    .where(eq(s3MultipartParts.uploadId, uploadId))
    .orderBy(s3MultipartParts.partNumber);

  if (parts.length === 0) return invalidRequest("No parts uploaded");

  const [existing] = await db
    .select({
      id: files.id,
      size: files.size,
      storagePath: files.storagePath,
      storageConfigId: files.storageConfigId,
    })
    .from(files)
    .where(and(eq(files.workspaceId, auth.workspaceId), eq(files.s3Key, key)));

  const totalSize = parts.reduce((sum, part) => sum + part.size, 0);
  const projectedUsed =
    (ws.storageUsed ?? 0) - (existing?.size ?? 0) + totalSize;
  if (
    (await shouldEnforceQuota(auth.workspaceId)) &&
    projectedUsed > (ws.storageLimit ?? 0)
  ) {
    return quotaExceeded();
  }

  const { dirSegments, fileName } = parseS3Key(key);
  if (!fileName) {
    return invalidRequest("Object key must include a file name");
  }

  const { storage, configId, providerName } = await createStorageForWorkspace(
    auth.workspaceId,
  );

  try {
    // Stream parts into a single logical object to avoid buffering entire uploads.
    const mergedStream = createMultipartObjectStream(storage, parts);
    await storage.upload({
      path: upload.storagePath,
      data: mergedStream,
      contentType: upload.contentType,
    });

    const folderId = await resolveOrCreateFolderChain(
      db,
      auth.workspaceId,
      auth.userId,
      dirSegments,
    );
    const etag = createHash("md5").update(uploadId).digest("hex");

    const sizeDiff = totalSize - (existing?.size ?? 0);
    if (existing) {
      // Clean up old data from previous backend if config changed
      if (existing.storageConfigId !== configId) {
        try {
          const oldStorage = await createStorageForFile(
            existing.storageConfigId,
          );
          await oldStorage.delete(existing.storagePath);
        } catch {
          /* best effort */
        }
      } else if (existing.storagePath !== upload.storagePath) {
        try {
          await storage.delete(existing.storagePath);
        } catch {
          /* best effort */
        }
      }

      await db
        .update(files)
        .set({
          size: totalSize,
          mimeType: upload.contentType,
          storagePath: upload.storagePath,
          storageProvider: providerName,
          storageConfigId: configId,
          checksum: etag,
          updatedAt: new Date(),
        })
        .where(eq(files.id, existing.id));
    } else {
      await db.insert(files).values({
        id: randomUUID(),
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        folderId,
        name: fileName,
        mimeType: upload.contentType,
        size: totalSize,
        storagePath: upload.storagePath,
        storageProvider: providerName,
        storageConfigId: configId,
        status: "ready",
        s3Key: key,
        checksum: etag,
      });
    }

    if (sizeDiff !== 0) {
      await db
        .update(workspaces)
        .set({
          storageUsed: sql`GREATEST(${workspaces.storageUsed} + ${sizeDiff}, 0)`,
        })
        .where(eq(workspaces.id, auth.workspaceId));
    }

    // Mark multipart upload as complete and clean up parts records
    await db
      .update(s3MultipartUploads)
      .set({ status: "completed" })
      .where(eq(s3MultipartUploads.id, upload.id));
    await db
      .delete(s3MultipartParts)
      .where(eq(s3MultipartParts.uploadId, uploadId));

    for (const part of parts) {
      try {
        await storage.delete(part.storagePath);
      } catch {
        /* best effort */
      }
    }

    return xmlResponse(completeMultipartUploadXml(bucket, key, etag));
  } catch (err) {
    return internalError((err as Error).message);
  }
}

async function handleAbortMultipart(
  db: ReturnType<typeof getDb>,
  auth: AuthResult,
  uploadId: string,
): Promise<Response> {
  const [upload] = await db
    .select()
    .from(s3MultipartUploads)
    .where(
      and(
        eq(s3MultipartUploads.uploadId, uploadId),
        eq(s3MultipartUploads.workspaceId, auth.workspaceId),
      ),
    );

  if (!upload) return noSuchUpload();

  // Delete part files
  const parts = await db
    .select()
    .from(s3MultipartParts)
    .where(eq(s3MultipartParts.uploadId, uploadId));

  const { storage } = await createStorageForWorkspace(auth.workspaceId);
  for (const part of parts) {
    try {
      await storage.delete(part.storagePath);
    } catch {
      /* best effort */
    }
  }

  // Clean up DB records
  await db
    .delete(s3MultipartParts)
    .where(eq(s3MultipartParts.uploadId, uploadId));
  await db
    .delete(s3MultipartUploads)
    .where(eq(s3MultipartUploads.id, upload.id));

  return new Response(null, { status: 204 });
}

// ── ListObjectsV2 ───────────────────────────────────────────────────────

async function handleListObjects(
  req: NextRequest,
  db: ReturnType<typeof getDb>,
  workspaceId: string,
  bucket: string,
): Promise<Response> {
  const prefix = req.nextUrl.searchParams.get("prefix") ?? "";
  const delimiter = req.nextUrl.searchParams.get("delimiter") ?? "";
  const maxKeys = Math.min(
    parseInt(req.nextUrl.searchParams.get("max-keys") ?? "1000", 10),
    1000,
  );
  const continuationToken = req.nextUrl.searchParams.get("continuation-token");
  const offset = continuationToken
    ? parseInt(Buffer.from(continuationToken, "base64url").toString(), 10)
    : 0;

  // Lazy backfill s3Keys for web-uploaded files
  const filesWithoutKey = await db
    .select({ id: files.id, name: files.name, folderId: files.folderId })
    .from(files)
    .where(
      and(
        eq(files.workspaceId, workspaceId),
        isNull(files.s3Key),
        eq(files.status, "ready"),
      ),
    )
    .limit(100);

  for (const f of filesWithoutKey) {
    const s3Key = await buildS3KeyForFile(db, workspaceId, f);
    await db.update(files).set({ s3Key }).where(eq(files.id, f.id));
  }

  const condition = prefix
    ? and(
        eq(files.workspaceId, workspaceId),
        like(files.s3Key, `${prefix}%`),
        eq(files.status, "ready"),
      )
    : and(eq(files.workspaceId, workspaceId), eq(files.status, "ready"));

  const allMatching = await db
    .select({
      key: files.s3Key,
      size: files.size,
      lastModified: files.updatedAt,
      etag: files.id,
    })
    .from(files)
    .where(condition!)
    .orderBy(files.s3Key);

  const contents: {
    key: string;
    lastModified: Date;
    size: number;
    etag: string;
  }[] = [];
  const commonPrefixSet = new Set<string>();

  for (const row of allMatching) {
    if (!row.key) continue;
    const keyAfterPrefix = row.key.slice(prefix.length);
    if (delimiter && keyAfterPrefix.includes(delimiter)) {
      const prefixEnd = keyAfterPrefix.indexOf(delimiter) + delimiter.length;
      commonPrefixSet.add(prefix + keyAfterPrefix.slice(0, prefixEnd));
    } else {
      contents.push({
        key: row.key,
        lastModified: row.lastModified,
        size: row.size,
        etag: row.etag,
      });
    }
  }

  const commonPrefixes = Array.from(commonPrefixSet).sort();
  const allItems = [
    ...contents.map((c) => ({ type: "object" as const, ...c })),
    ...commonPrefixes.map((p) => ({ type: "prefix" as const, prefix: p })),
  ];

  const paginated = allItems.slice(offset, offset + maxKeys);
  const isTruncated = offset + maxKeys < allItems.length;
  const nextToken = isTruncated
    ? Buffer.from(String(offset + maxKeys)).toString("base64url")
    : undefined;

  const paginatedContents = paginated.filter(
    (i) => i.type === "object",
  ) as typeof contents;
  const paginatedPrefixes = paginated
    .filter((i) => i.type === "prefix")
    .map((i) => (i as any).prefix as string);

  return xmlResponse(
    listObjectsV2Xml({
      bucket,
      prefix,
      delimiter,
      maxKeys,
      isTruncated,
      contents: paginatedContents,
      commonPrefixes: paginatedPrefixes,
      continuationToken: continuationToken ?? undefined,
      nextContinuationToken: nextToken,
      keyCount: paginated.length,
    }),
  );
}
