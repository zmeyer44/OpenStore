import { and, eq, inArray, isNull } from "drizzle-orm";
import { fileBlobs, folders } from "@locker/database";
import type { DatabaseClient } from "@locker/database";
import { asConfigObject, getConfigString, joinStoragePath, type StoreRow } from "./store-utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Walk the folder parent chain to build a human-readable relative path.
 *
 * file "q1.pdf" in chain root -> "docs" -> "reports" => "docs/reports/q1.pdf"
 * file "q1.pdf" at root                              => "q1.pdf"
 */
export async function buildFolderPath(
  db: DatabaseClient,
  workspaceId: string,
  file: { name: string; folderId: string | null },
): Promise<string> {
  if (!file.folderId) return file.name;

  const segments: string[] = [];
  let currentId: string | null = file.folderId;

  while (currentId) {
    const [folder] = await db
      .select({ name: folders.name, parentId: folders.parentId })
      .from(folders)
      .where(
        and(eq(folders.id, currentId), eq(folders.workspaceId, workspaceId)),
      );

    if (!folder) break;
    segments.unshift(folder.name);
    currentId = folder.parentId;
  }

  segments.push(file.name);
  return segments.join("/");
}

/**
 * Build the storage path for a file on a specific store.
 *
 * Platform stores (`credentialSource === "platform"`):
 *   `<rootPrefix>/<workspaceId>/<displayPath>`
 *
 * User stores (`credentialSource === "store"`):
 *   `<rootPrefix>/<displayPath>`
 */
export function buildStoreTargetPath(
  store: Pick<StoreRow, "config" | "credentialSource">,
  workspaceId: string,
  displayPath: string,
): string {
  const config = asConfigObject(store.config as Record<string, unknown> | null);
  const rootPrefix = getConfigString(config, "rootPrefix");

  if (store.credentialSource === "platform") {
    return joinStoragePath(rootPrefix, `${workspaceId}/${displayPath}`);
  }

  return joinStoragePath(rootPrefix, displayPath);
}

/**
 * Detect whether an objectKey uses the legacy format:
 * `<workspaceId-uuid>/<blobId-uuid>/<filename>`
 */
export function isLegacyObjectKey(objectKey: string): boolean {
  const segments = objectKey.split("/");
  return (
    segments.length >= 3 &&
    UUID_RE.test(segments[0]!) &&
    UUID_RE.test(segments[1]!)
  );
}

/**
 * Ensure `candidateKey` is unique within the workspace's `fileBlobs`.
 *
 * On collision, appends " (1)", " (2)", etc. to the filename stem.
 * If `overwrite` is true, returns the candidate unchanged.
 */
export async function deduplicateObjectKey(
  db: DatabaseClient,
  workspaceId: string,
  candidateKey: string,
  overwrite: boolean,
): Promise<string> {
  if (overwrite) return candidateKey;

  const lastSlash = candidateKey.lastIndexOf("/");
  const dir = lastSlash >= 0 ? candidateKey.slice(0, lastSlash + 1) : "";
  const fileName =
    lastSlash >= 0 ? candidateKey.slice(lastSlash + 1) : candidateKey;
  const dotIndex = fileName.lastIndexOf(".");
  const stem = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex > 0 ? fileName.slice(dotIndex) : "";

  let current = candidateKey;
  let counter = 0;

  for (;;) {
    const [existing] = await db
      .select({ id: fileBlobs.id })
      .from(fileBlobs)
      .where(
        and(
          eq(fileBlobs.workspaceId, workspaceId),
          eq(fileBlobs.objectKey, current),
          inArray(fileBlobs.state, ["ready", "pending"]),
        ),
      )
      .limit(1);

    if (!existing) return current;

    counter += 1;
    current = `${dir}${stem} (${counter})${ext}`;
  }
}
