import { put, del, head, list } from "@vercel/blob";
import type { StorageProvider } from "./interface";

export interface VercelBlobConfig {
  token?: string;
}

export class VercelBlobAdapter implements StorageProvider {
  readonly supportsPresignedUpload = false;
  private token: string | undefined;

  constructor(config?: VercelBlobConfig) {
    this.token = config?.token;
  }

  private get tokenOpts(): { token: string } | Record<string, never> {
    return this.token ? { token: this.token } : {};
  }

  async upload(params: {
    path: string;
    data: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; path: string }> {
    const blob = await put(params.path, params.data, {
      access: "private",
      contentType: params.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      ...this.tokenOpts,
    });

    return { url: blob.url, path: params.path };
  }

  async download(path: string): Promise<{
    data: ReadableStream;
    contentType: string;
    size: number;
  }> {
    const blobMeta = await head(path, this.tokenOpts);
    const resolvedToken = this.token ?? process.env.BLOB_READ_WRITE_TOKEN;
    const response = await fetch(blobMeta.url, {
      headers: resolvedToken
        ? { authorization: `Bearer ${resolvedToken}` }
        : {},
    });

    if (!response.ok || !response.body) {
      throw new Error(
        `Failed to download blob (status ${response.status}): ${path}`,
      );
    }

    return {
      data: response.body,
      contentType: blobMeta.contentType,
      size: blobMeta.size,
    };
  }

  async getSignedUrl(path: string, _expiresIn?: number): Promise<string> {
    const blobMeta = await head(path, this.tokenOpts);
    return blobMeta.url;
  }

  async getUploadUrl(params: {
    path: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string }> {
    // Vercel Blob uses client uploads with tokens, not presigned URLs
    return { url: `/api/upload?path=${encodeURIComponent(params.path)}` };
  }

  async delete(path: string): Promise<void> {
    await del(path, this.tokenOpts);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await head(path, this.tokenOpts);
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
    const results: { path: string; size: number; lastModified: Date }[] = [];
    let cursor: string | undefined;

    do {
      const response = await list({
        prefix,
        cursor,
        ...this.tokenOpts,
      });

      for (const blob of response.blobs) {
        results.push({
          path: blob.pathname,
          size: blob.size,
          lastModified: blob.uploadedAt,
        });
      }

      cursor = response.hasMore ? response.cursor : undefined;
    } while (cursor);

    return results;
  }
}
