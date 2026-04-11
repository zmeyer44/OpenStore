import type { StorageProvider } from "./interface";
import { LocalStorageAdapter } from "./local";
import { S3StorageAdapter } from "./s3";
import type { S3StorageConfig } from "./s3";
import { R2StorageAdapter } from "./r2";
import type { R2StorageConfig } from "./r2";
import { VercelBlobAdapter } from "./vercel";
import { verifyLocalFileSignature } from "./local-signing";

import type { VercelBlobConfig } from "./vercel";

export type {
  StorageProvider,
  S3StorageConfig,
  R2StorageConfig,
  VercelBlobConfig,
};
export {
  LocalStorageAdapter,
  S3StorageAdapter,
  R2StorageAdapter,
  VercelBlobAdapter,
};
export { verifyLocalFileSignature };

export function createStorage(): StorageProvider {
  switch (process.env.BLOB_STORAGE_PROVIDER) {
    case "s3":
      return new S3StorageAdapter();
    case "r2":
      return new R2StorageAdapter();
    case "vercel":
      return new VercelBlobAdapter();
    case "local":
    default:
      return new LocalStorageAdapter();
  }
}

/**
 * Credential shapes expected per provider (stored as encrypted JSON).
 */
export type StorageCredentials =
  | { provider: "s3"; accessKeyId: string; secretAccessKey: string }
  | {
      provider: "r2";
      accountId: string;
      accessKeyId: string;
      secretAccessKey: string;
    }
  | { provider: "vercel_blob"; readWriteToken: string };

export interface WorkspaceStorageConfig {
  provider: "s3" | "r2" | "vercel_blob" | "local";
  bucket?: string | null;
  region?: string | null;
  endpoint?: string | null;
  accountId?: string | null;
  publicUrl?: string | null;
  baseDir?: string | null;
  credentials?: StorageCredentials | null;
}

/**
 * Create a storage adapter from a workspace's custom config.
 * Falls back to the default (env-var) storage when no config is provided.
 */
export function createStorageFromConfig(
  config: WorkspaceStorageConfig,
): StorageProvider {
  const creds = config.credentials;
  switch (config.provider) {
    case "s3":
      return new S3StorageAdapter({
        accessKeyId:
          creds && creds.provider === "s3" ? creds.accessKeyId : undefined,
        secretAccessKey:
          creds && creds.provider === "s3" ? creds.secretAccessKey : undefined,
        bucket: config.bucket ?? undefined,
        region: config.region ?? undefined,
        endpoint: config.endpoint ?? undefined,
      });
    case "r2":
      return new R2StorageAdapter({
        accountId:
          config.accountId ??
          (creds && creds.provider === "r2" ? creds.accountId : undefined),
        accessKeyId:
          creds && creds.provider === "r2" ? creds.accessKeyId : undefined,
        secretAccessKey:
          creds && creds.provider === "r2" ? creds.secretAccessKey : undefined,
        bucket: config.bucket ?? undefined,
        publicUrl: config.publicUrl ?? undefined,
      });
    case "vercel_blob":
      return new VercelBlobAdapter({
        token:
          creds && creds.provider === "vercel_blob"
            ? creds.readWriteToken
            : undefined,
      });
    case "local":
      return new LocalStorageAdapter({
        baseDir: config.baseDir ?? undefined,
      });
    default:
      return createStorage();
  }
}
