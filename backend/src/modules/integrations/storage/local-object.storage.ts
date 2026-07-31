import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { generateId } from '../../../common/utils';
import {
  IObjectStorage,
  StoredObject,
} from '../../../common/interfaces/photo-storage.interface';

@Injectable()
export class LocalObjectStorage implements IObjectStorage, OnModuleInit {
  private readonly logger = new Logger(LocalObjectStorage.name);
  private readonly rootDir = join(process.cwd(), 'uploads');

  async onModuleInit(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    this.logger.log(`Local object storage ready at ${this.rootDir}`);
  }

  async upload(input: {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    fileName: string;
  }): Promise<StoredObject> {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${input.folder}/${generateId()}-${safeName}`;
    const absolutePath = join(this.rootDir, storageKey);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    const baseUrl =
      process.env.PUBLIC_BASE_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`;

    return {
      storageKey,
      publicUrl: `${baseUrl}/media/${storageKey.replace(/\\/g, '/')}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(join(this.rootDir, storageKey));
    } catch {
      // ignore missing files
    }
  }
}
