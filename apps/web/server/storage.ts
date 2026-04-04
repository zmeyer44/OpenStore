import { eq, and } from "drizzle-orm";
import { getDb } from "@locker/database/client";
import { workspaceStorageConfigs } from "@locker/database";
import {
  createStorage,
  createStorageFromConfig,
  type StorageProvider,
  type WorkspaceStorageConfig,
} from "@locker/storage";
import { decryptSecret } from "./s3/auth";

// ── Internal helpers ────────────────────────────────────────────────────

function buildConfig(row: {
  provider: string;
  bucket: string;
  region: string | null;
  endpoint: string | null;
  encryptedCredentials: string;
}): WorkspaceStorageConfig {
  let credentials: WorkspaceStorageConfig["credentials"];
  try {
    credentials = JSON.parse(decryptSecret(row.encryptedCredentials));
  } catch {
    throw new Error(
      "Failed to decrypt storage credentials — the encryption key may have been rotated",
    );
  }
  return {
    provider: row.provider as "s3" | "r2" | "vercel",
    bucket: row.bucket,
    region: row.region,
    endpoint: row.endpoint,
    credentials,
  };
}

/**
 * Load the active BYOB config for a workspace.
 * Returns the config row (with id) or null.
 */
async function loadActiveConfig(workspaceId: string) {
  const db = getDb();

  const [row] = await db
    .select({
      id: workspaceStorageConfigs.id,
      provider: workspaceStorageConfigs.provider,
      bucket: workspaceStorageConfigs.bucket,
      region: workspaceStorageConfigs.region,
      endpoint: workspaceStorageConfigs.endpoint,
      encryptedCredentials: workspaceStorageConfigs.encryptedCredentials,
    })
    .from(workspaceStorageConfigs)
    .where(
      and(
        eq(workspaceStorageConfigs.workspaceId, workspaceId),
        eq(workspaceStorageConfigs.isActive, true),
      ),
    );

  return row ?? null;
}

/**
 * Load a specific config by ID (may be active or inactive).
 */
async function loadConfigById(configId: string) {
  const db = getDb();

  const [row] = await db
    .select({
      id: workspaceStorageConfigs.id,
      provider: workspaceStorageConfigs.provider,
      bucket: workspaceStorageConfigs.bucket,
      region: workspaceStorageConfigs.region,
      endpoint: workspaceStorageConfigs.endpoint,
      encryptedCredentials: workspaceStorageConfigs.encryptedCredentials,
    })
    .from(workspaceStorageConfigs)
    .where(eq(workspaceStorageConfigs.id, configId));

  return row ?? null;
}

// ── Public API ──────────────────────────────────────────────────────────

export interface WorkspaceStorageResult {
  storage: StorageProvider;
  /** The config row ID to stamp on new file records (null = platform default). */
  configId: string | null;
  /** Provider name for the storageProvider column. */
  providerName: string;
}

/**
 * Create a storage adapter for **new uploads** to a workspace.
 * Returns the adapter plus the config ID and provider name that should
 * be persisted on the new file record.
 */
export async function createStorageForWorkspace(
  workspaceId: string,
): Promise<WorkspaceStorageResult> {
  const row = await loadActiveConfig(workspaceId);
  if (!row) {
    return {
      storage: createStorage(),
      configId: null,
      providerName: process.env.BLOB_STORAGE_PROVIDER ?? "local",
    };
  }
  return {
    storage: createStorageFromConfig(buildConfig(row)),
    configId: row.id,
    providerName: row.provider,
  };
}

/**
 * Create a storage adapter appropriate for accessing an **existing file**.
 *
 * Routes via the file's `storageConfigId`:
 * - If the file has a config ID, loads that specific config row (which may
 *   be inactive/historical) so reads always hit the correct bucket.
 * - If the config row was deleted (SET NULL), falls back to platform default.
 * - If the file has no config ID, it was stored with the platform default.
 */
export async function createStorageForFile(
  storageConfigId: string | null,
): Promise<StorageProvider> {
  if (!storageConfigId) {
    return createStorage();
  }

  const row = await loadConfigById(storageConfigId);
  if (!row) {
    // Config was hard-deleted (shouldn't happen with SET NULL, but be safe)
    return createStorage();
  }

  return createStorageFromConfig(buildConfig(row));
}

/**
 * Whether storage quota should be enforced for new uploads to a workspace.
 *
 * Quotas are skipped when:
 * - The workspace has an active BYOB config (user provides their own bucket)
 * - The platform default storage is 'local' (self-hosted / development)
 */
export async function shouldEnforceQuota(
  workspaceId: string,
): Promise<boolean> {
  return shouldEnforceQuotaForConfig(workspaceId, undefined);
}

/**
 * Whether storage quota should be enforced for a specific storage config.
 *
 * Use this for resumed uploads where the target backend was decided at
 * initiate time and may differ from the workspace's current config.
 *
 * @param storageConfigId - The file's storageConfigId. Null means platform
 *   default; undefined means "use current workspace config" (same as
 *   shouldEnforceQuota).
 */
export async function shouldEnforceQuotaForConfig(
  workspaceId: string,
  storageConfigId: string | null | undefined,
): Promise<boolean> {
  const platformProvider = process.env.BLOB_STORAGE_PROVIDER ?? "local";
  if (platformProvider === "local") return false;

  if (storageConfigId === undefined) {
    // Caller wants current-workspace semantics (new uploads)
    const row = await loadActiveConfig(workspaceId);
    if (row) return false; // BYOB
    return true;
  }

  // null configId = platform default storage → enforce quota
  if (storageConfigId === null) return true;

  // Non-null configId = bytes go to a BYOB bucket → no quota
  return false;
}
