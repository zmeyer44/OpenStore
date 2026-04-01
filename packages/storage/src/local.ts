import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import type { StorageProvider } from './interface';

export class LocalStorageAdapter implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = process.env.LOCAL_BLOB_DIR ?? './local-blobs';
  }

  private resolvePath(filePath: string): string {
    return path.resolve(this.baseDir, filePath);
  }

  async upload(params: {
    path: string;
    data: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; path: string }> {
    const fullPath = this.resolvePath(params.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    let buffer: Buffer;
    if (Buffer.isBuffer(params.data)) {
      buffer = params.data;
    } else {
      const reader = (params.data as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          chunks.push(result.value);
        }
      }
      buffer = Buffer.concat(chunks);
    }

    await fs.writeFile(fullPath, buffer);
    return { url: `/api/files/serve/${params.path}`, path: params.path };
  }

  async download(filePath: string): Promise<{
    data: ReadableStream;
    contentType: string;
    size: number;
  }> {
    const fullPath = this.resolvePath(filePath);
    const buffer = await fs.readFile(fullPath);
    const stat = await fs.stat(fullPath);

    const readable = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });

    const stream = Readable.toWeb(readable) as ReadableStream;
    return {
      data: stream,
      contentType: 'application/octet-stream',
      size: stat.size,
    };
  }

  async getSignedUrl(filePath: string, _expiresIn?: number): Promise<string> {
    return `/api/files/serve/${filePath}`;
  }

  async getUploadUrl(params: {
    path: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string }> {
    // Local storage uses direct upload, no presigned URL needed
    return { url: `/api/upload?path=${encodeURIComponent(params.path)}` };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
