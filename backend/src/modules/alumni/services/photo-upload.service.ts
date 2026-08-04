import { Inject, Injectable } from '@nestjs/common';
import {
  PHOTO_STORAGE,
  PHOTO_UPLOAD_REPOSITORY,
} from '../../../common/constants/tokens';
import { BusinessException } from '../../../common/exceptions';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import type { IPhotoUploadRepository } from '../interfaces/supporting.repository.interface';
import { UploadPhotoResponseDto } from '../dto/f001.dto';

@Injectable()
export class PhotoUploadService {
  constructor(
    @Inject(PHOTO_STORAGE) private readonly photoStorage: IObjectStorage,
    @Inject(PHOTO_UPLOAD_REPOSITORY)
    private readonly photoUploadRepository: IPhotoUploadRepository,
  ) {}

  async uploadTemp(file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }): Promise<UploadPhotoResponseDto> {
    if (!file) {
      throw new BusinessException('Photo file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BusinessException('Only JPEG, PNG, or WEBP photos are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BusinessException('Photo must be 5MB or smaller');
    }

    const stored = await this.photoStorage.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      folder: 'temp',
      fileName: file.originalname,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const upload = await this.photoUploadRepository.create({
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      expiresAt,
    });

    return {
      upload_id: upload.id,
      public_url: stored.downloadUrl,
      expires_at: upload.expiresAt,
    };
  }
}
