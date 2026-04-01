export interface StorageProvider {
  upload(params: {
    path: string;
    data: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; path: string }>;

  download(path: string): Promise<{
    data: ReadableStream;
    contentType: string;
    size: number;
  }>;

  getSignedUrl(path: string, expiresIn?: number): Promise<string>;

  getUploadUrl(params: {
    path: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string; fields?: Record<string, string> }>;

  delete(path: string): Promise<void>;

  exists(path: string): Promise<boolean>;
}
