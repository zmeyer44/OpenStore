import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider } from './interface';

export class S3StorageAdapter implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET ?? 'openstore';
  }

  async upload(params: {
    path: string;
    data: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; path: string }> {
    let body: Buffer;
    if (Buffer.isBuffer(params.data)) {
      body = params.data;
    } else {
      const reader = (params.data as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) chunks.push(result.value);
      }
      body = Buffer.concat(chunks);
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.path,
        Body: body,
        ContentType: params.contentType,
        Metadata: params.metadata,
      }),
    );

    return {
      url: `https://${this.bucket}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${params.path}`,
      path: params.path,
    };
  }

  async download(path: string): Promise<{
    data: ReadableStream;
    contentType: string;
    size: number;
  }> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );

    return {
      data: response.Body!.transformToWebStream(),
      contentType: response.ContentType ?? 'application/octet-stream',
      size: response.ContentLength ?? 0,
    };
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });
    return awsGetSignedUrl(this.client, command, { expiresIn });
  }

  async getUploadUrl(params: {
    path: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.path,
      ContentType: params.contentType,
    });
    const url = await awsGetSignedUrl(this.client, command, {
      expiresIn: params.expiresIn ?? 3600,
    });
    return { url };
  }

  async delete(path: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
