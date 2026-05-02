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
