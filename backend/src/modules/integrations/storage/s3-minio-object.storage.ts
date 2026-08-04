import {
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { generateId } from '../../../common/utils';
import {
  IObjectStorage,
  StoredObject,
} from '../../../common/interfaces/photo-storage.interface';

@Injectable()
export class S3MinioObjectStorage implements IObjectStorage, OnModuleInit {
  private readonly logger = new Logger(S3MinioObjectStorage.name);
  private client!: S3Client;
  private bucket!: string;
  private publicBaseUrl!: string;
  private signedUrls!: boolean;
  private signedUrlTtlSeconds!: number;

  onModuleInit(): void {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    this.bucket = process.env.S3_BUCKET ?? 'taleem-alumni';
    this.publicBaseUrl =
      process.env.S3_PUBLIC_URL ??
      `${endpoint?.replace(/\/$/, '')}/${this.bucket}`;
    this.signedUrls = process.env.S3_SIGNED_URLS !== 'false';
    this.signedUrlTtlSeconds = Number(
      process.env.S3_SIGNED_URL_TTL_SECONDS ?? 60 * 60 * 24 * 7,
    );

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Object storage selected but S3_ENDPOINT / S3_ACCESS_KEY / S3_SECRET_KEY are missing',
      );
    }

    this.client = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    });

    this.logger.log(
      `Object storage ready endpoint=${endpoint} bucket=${this.bucket} signedUrls=${this.signedUrls}`,
    );
  }

  async upload(input: {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    fileName: string;
  }): Promise<StoredObject> {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${input.folder}/${generateId()}-${safeName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`;
    const downloadUrl = this.signedUrls
      ? await getSignedUrl(
          this.client,
          new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
          { expiresIn: this.signedUrlTtlSeconds },
        )
      : publicUrl;

    return { storageKey, publicUrl, downloadUrl };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }

  async resolveDownloadUrl(storageKeyOrUrl: string): Promise<string> {
    if (!storageKeyOrUrl) return storageKeyOrUrl;
    if (!this.signedUrls) return storageKeyOrUrl;

    const key = this.toStorageKey(storageKeyOrUrl);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.signedUrlTtlSeconds },
    );
  }

  private toStorageKey(storageKeyOrUrl: string): string {
    const base = this.publicBaseUrl.replace(/\/$/, '');
    if (storageKeyOrUrl.startsWith(base + '/')) {
      return storageKeyOrUrl.slice(base.length + 1);
    }
    try {
      const parsed = new URL(storageKeyOrUrl);
      const marker = `/file/${this.bucket}/`;
      const idx = parsed.pathname.indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
      }
    } catch {
      // treat as raw storage key
    }
    return storageKeyOrUrl.replace(/^\//, '');
  }
}
