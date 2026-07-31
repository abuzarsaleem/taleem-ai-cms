import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

  onModuleInit(): void {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    this.bucket = process.env.S3_BUCKET ?? 'taleem-alumni';
    this.publicBaseUrl =
      process.env.S3_PUBLIC_URL ??
      `${endpoint?.replace(/\/$/, '')}/${this.bucket}`;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3/MinIO storage selected but S3_ENDPOINT / S3_ACCESS_KEY / S3_SECRET_KEY are missing',
      );
    }

    this.client = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    });

    this.logger.log(
      `S3/MinIO storage ready endpoint=${endpoint} bucket=${this.bucket}`,
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

    return {
      storageKey,
      publicUrl: `${this.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }
}
