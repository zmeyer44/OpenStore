import * as fs from 'node:fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { StorageProvider } from './interface';
import { createLocalFileSignature } from './local-signing';

export class LocalStorageAdapter implements StorageProvider {
  readonly supportsPresignedUpload = false;
  private baseDir: string;
  private resolvedBaseDir: string;

  constructor(config?: { baseDir?: string }) {
    this.baseDir = config?.baseDir ?? process.env.LOCAL_BLOB_DIR ?? './local-blobs';
    this.resolvedBaseDir = path.resolve(this.baseDir);
  }

  private resolvePath(filePath: string): string {
    const resolvedPath = path.resolve(this.baseDir, filePath);
    const normalizedBase = `${this.resolvedBaseDir}${path.sep}`;
    if (
      resolvedPath !== this.resolvedBaseDir &&
      !resolvedPath.startsWith(normalizedBase)
    ) {
      throw new Error('Invalid blob path');
    }
    return resolvedPath;
  }

  private encodePathForUrl(filePath: string): string {
    return filePath.split('/').map(encodeURIComponent).join('/');
  }

  async upload(params: {
    path: string;
    data: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; path: string }> {
    const fullPath = this.resolvePath(params.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    if (Buffer.isBuffer(params.data)) {
      await fs.writeFile(fullPath, params.data);
    } else {
      // Stream directly to disk — no buffering in memory
      const webStream = params.data as ReadableStream;
      const nodeReadable = Readable.fromWeb(webStream as any);
      const writeStream = createWriteStream(fullPath);
      await pipeline(nodeReadable, writeStream);
    }

    const url = await this.getSignedUrl(params.path);
    return { url, path: params.path };
  }

  async download(filePath: string): Promise<{
    data: ReadableStream;
    contentType: string;
    size: number;
  }> {
    const fullPath = this.resolvePath(filePath);
    const stat = await fs.stat(fullPath);
    const readable = createReadStream(fullPath);

    const stream = Readable.toWeb(readable) as ReadableStream;
    return {
      data: stream,
      contentType: 'application/octet-stream',
      size: stat.size,
    };
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const ttl = Math.max(1, Math.floor(expiresIn));
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;
    const signature = createLocalFileSignature(filePath, expiresAt);
    const encodedPath = this.encodePathForUrl(filePath);
    return `/api/files/serve/${encodedPath}?exp=${expiresAt}&sig=${signature}`;
  }

  async getUploadUrl(params: {
    path: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string }> {
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

  async list(prefix: string): Promise<{
    path: string;
    size: number;
    lastModified: Date;
  }[]> {
    const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '');
    const rootDir = normalizedPrefix
      ? this.resolvePath(normalizedPrefix)
      : this.resolvedBaseDir;

    const results: { path: string; size: number; lastModified: Date }[] = [];

    const walk = async (currentDir: string) => {
      let entries: import("node:fs").Dirent[];
      try {
        entries = (await fs.readdir(currentDir, {
          withFileTypes: true,
        })) as import("node:fs").Dirent[];
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw err;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
          continue;
        }

        if (!entry.isFile()) continue;
        const stat = await fs.stat(fullPath);
        const relativePath = path
          .relative(this.resolvedBaseDir, fullPath)
          .split(path.sep)
          .join('/');
        results.push({
          path: relativePath,
          size: stat.size,
          lastModified: stat.mtime,
        });
      }
    };

    await walk(rootDir);
    return results.sort((left, right) => left.path.localeCompare(right.path));
  }
}
