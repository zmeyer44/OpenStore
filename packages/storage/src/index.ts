import type { StorageProvider } from './interface';
import { LocalStorageAdapter } from './local';
import { S3StorageAdapter } from './s3';
import { R2StorageAdapter } from './r2';
import { VercelBlobAdapter } from './vercel';

export type { StorageProvider };
export { LocalStorageAdapter, S3StorageAdapter, R2StorageAdapter, VercelBlobAdapter };

export function createStorage(): StorageProvider {
  switch (process.env.BLOB_STORAGE_PROVIDER) {
    case 's3':
      return new S3StorageAdapter();
    case 'r2':
      return new R2StorageAdapter();
    case 'vercel':
      return new VercelBlobAdapter();
    case 'local':
    default:
      return new LocalStorageAdapter();
  }
}
