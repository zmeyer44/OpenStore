import { webHost } from "./web-host";

// The web app's tRPC server is configured with the superjson transformer.
// The HTTP wire format for a single batched call is:
//   GET  /api/trpc/<path>?batch=1&input={"0":{"json":<input>}}
//   POST /api/trpc/<path>?batch=1   body: {"0":{"json":<input>}}
// and the response is an array of `{result:{data:{json,meta?}}}` entries.
//
// For the inputs and outputs we actually need (folder lists, files, signed
// URLs), nothing requires superjson's reviver hooks — Dates come back as ISO
// strings inside the `json` payload and we keep them as strings. So we send
// `{ json: input }` with no meta and read back `data.json` directly. If a
// future call ever needs Date round-tripping we can plug in superjson then.

interface TrpcOptions {
  workspaceSlug?: string;
  signal?: AbortSignal;
}

export class TrpcError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function buildHeaders(opts: TrpcOptions): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.workspaceSlug) h["x-workspace-slug"] = opts.workspaceSlug;
  return h;
}

function unwrapBatch<T>(body: unknown): T {
  if (!Array.isArray(body)) {
    throw new TrpcError("Malformed tRPC response", 0);
  }
  const entry = body[0] as
    | {
        result?: { data?: { json: unknown } };
        error?: { json?: { message?: string }; message?: string };
      }
    | undefined;
  if (!entry) throw new TrpcError("Empty tRPC batch response", 0);
  if (entry.error) {
    const msg =
      entry.error.json?.message ?? entry.error.message ?? "tRPC error";
    throw new TrpcError(msg, 0);
  }
  if (!entry.result?.data) throw new TrpcError("Missing tRPC result", 0);
  return entry.result.data.json as T;
}

export async function trpcQuery<T>(
  path: string,
  input: unknown,
  opts: TrpcOptions = {},
): Promise<T> {
  const url = new URL(`${webHost()}/api/trpc/${path}`);
  url.searchParams.set("batch", "1");
  url.searchParams.set("input", JSON.stringify({ "0": { json: input } }));
  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: buildHeaders(opts),
    signal: opts.signal,
  });
  if (res.status === 401) throw new TrpcError("Not signed in", 401);
  if (!res.ok)
    throw new TrpcError(`tRPC ${path} failed: ${res.status}`, res.status);
  return unwrapBatch<T>(await res.json());
}

export async function trpcMutation<T>(
  path: string,
  input: unknown,
  opts: TrpcOptions = {},
): Promise<T> {
  const url = `${webHost()}/api/trpc/${path}?batch=1`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(opts),
    body: JSON.stringify({ "0": { json: input } }),
    signal: opts.signal,
  });
  if (res.status === 401) throw new TrpcError("Not signed in", 401);
  if (!res.ok)
    throw new TrpcError(`tRPC ${path} failed: ${res.status}`, res.status);
  return unwrapBatch<T>(await res.json());
}

export async function probeSession(): Promise<boolean> {
  // better-auth exposes /api/auth/get-session for cookie-bearing probes.
  const res = await fetch(`${webHost()}/api/auth/get-session`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return false;
  const body = (await res.json().catch(() => null)) as {
    user?: { id?: string };
  } | null;
  return !!body?.user?.id;
}

export async function downloadAsBlob(
  url: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await fetch(url, { credentials: "include", signal });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// ── Upload helpers ──────────────────────────────────────────────────────────
// These run in the popup (a privileged extension context). XHR is used over
// fetch so we get upload progress events. Cookies ride along on the streaming
// endpoint thanks to host_permissions; presigned S3 URLs are signed and need
// no credentials.

// Mirrors @locker/common — kept inline so the extension package doesn't pull
// in the workspace's TS server deps (zod, drizzle, ...). Server-side validation
// is the source of truth; the popup only uses these for client-side gating.
export const UPLOAD_MAX_FILE_SIZE = 100 * 1024 * 1024;
export const UPLOAD_MULTIPART_PART_SIZE = 10 * 1024 * 1024;
const UPLOAD_MULTIPART_MAX_CONCURRENCY = 4;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadPresignedPut(
  file: File,
  presignedUrl: string,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100),
        });
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    // xhr.abort() fires the abort event, not error/load — without this the
    // wrapping Promise would hang when cancellation comes in via signal.
    xhr.onabort = () =>
      reject(new DOMException("Upload cancelled", "AbortError"));
    if (signal) signal.addEventListener("abort", () => xhr.abort());
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.send(file);
  });
}

export async function uploadServerBuffered(
  file: File,
  workspaceSlug: string,
  fileId: string,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100),
        });
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(data.error ?? `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () =>
      reject(new DOMException("Upload cancelled", "AbortError"));
    xhr.withCredentials = true;
    if (signal) signal.addEventListener("abort", () => xhr.abort());
    xhr.open("PUT", `${webHost()}/api/upload/stream`);
    xhr.setRequestHeader("x-workspace-slug", workspaceSlug);
    xhr.setRequestHeader("x-file-id", fileId);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.send(file);
  });
}

export interface MultipartPart {
  partNumber: number;
  url: string;
}

export async function uploadMultipart(
  file: File,
  parts: MultipartPart[],
  partSize: number,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<{ partNumber: number; etag: string }[]> {
  const partLoaded = new Map<number, number>();
  const reportProgress = () => {
    if (!onProgress) return;
    let loaded = 0;
    partLoaded.forEach((v) => (loaded += v));
    onProgress({
      loaded,
      total: file.size,
      percentage: Math.round((loaded / file.size) * 100),
    });
  };

  const slices = parts.map((part) => {
    const start = (part.partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    return { ...part, blob: file.slice(start, end) };
  });

  const results: { partNumber: number; etag: string }[] = [];
  const executing = new Set<Promise<void>>();

  for (const part of slices) {
    if (signal?.aborted) {
      throw new DOMException("Upload cancelled", "AbortError");
    }
    const task: Promise<void> = uploadSinglePart(
      part,
      (loaded) => {
        partLoaded.set(part.partNumber, loaded);
        reportProgress();
      },
      signal,
    )
      .then((result) => {
        results.push(result);
      })
      .finally(() => {
        executing.delete(task);
      });
    executing.add(task);
    if (executing.size >= UPLOAD_MULTIPART_MAX_CONCURRENCY) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

async function uploadSinglePart(
  part: { partNumber: number; url: string; blob: Blob },
  onPartProgress: (loaded: number) => void,
  signal?: AbortSignal,
  maxRetries = 3,
): Promise<{ partNumber: number; etag: string }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await doPartUpload(part, onPartProgress, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      if (attempt === maxRetries) throw err;
      // Exponential backoff between retries.
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("unreachable");
}

function doPartUpload(
  part: { partNumber: number; url: string; blob: Blob },
  onProgress: (loaded: number) => void,
  signal?: AbortSignal,
): Promise<{ partNumber: number; etag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          return reject(
            new Error(`No ETag in response for part ${part.partNumber}`),
          );
        }
        resolve({
          partNumber: part.partNumber,
          etag: etag.replace(/"/g, ""),
        });
      } else {
        reject(
          new Error(`Part ${part.partNumber} upload failed: ${xhr.status}`),
        );
      }
    };
    xhr.onerror = () =>
      reject(new Error(`Network error on part ${part.partNumber}`));
    xhr.onabort = () =>
      reject(new DOMException("Upload cancelled", "AbortError"));
    if (signal) signal.addEventListener("abort", () => xhr.abort());
    xhr.open("PUT", part.url);
    xhr.send(part.blob);
  });
}
