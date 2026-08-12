import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PHOTO_STORAGE } from '../../common/constants/tokens';
import { PortalMediaType } from '../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../common/exceptions';
import type { IObjectStorage } from '../../common/interfaces/photo-storage.interface';
import { PortalMediaEntity } from '../../database/entities';

export type PortalMediaFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class PortalMediaService {
  constructor(
    @InjectRepository(PortalMediaEntity)
    private readonly portalMediaRepo: Repository<PortalMediaEntity>,
    @Inject(PHOTO_STORAGE)
    private readonly objectStorage: IObjectStorage,
  ) {}

  async uploadImage(
    file: PortalMediaFile | undefined,
    mediaType: PortalMediaType,
    folder: string,
  ): Promise<{ media_id: string; public_url: string }> {
    if (!file) {
      throw new BusinessException('Image file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BusinessException('Only JPEG, PNG, or WEBP images are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BusinessException('Image must be 5MB or smaller');
    }

    const stored = await this.objectStorage.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      folder,
      fileName: file.originalname,
    });

    const media = await this.portalMediaRepo.save(
      this.portalMediaRepo.create({
        mediaType,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        mimeType: file.mimetype,
        originalFileName: file.originalname,
        meta: null,
      }),
    );

    const public_url =
      stored.downloadUrl ??
      (await this.objectStorage.resolveDownloadUrl(stored.publicUrl));

    return { media_id: media.id, public_url };
  }

  async requireById(
    mediaId: string,
    expectedType?: PortalMediaType,
  ): Promise<PortalMediaEntity> {
    const media = await this.portalMediaRepo.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new ResourceNotFoundException('Portal media', mediaId);
    }
    if (expectedType && media.mediaType !== expectedType) {
      throw new BusinessException(
        `Media ${mediaId} must be of type ${expectedType}`,
      );
    }
    return media;
  }

  async resolvePublicUrl(
    media: Pick<PortalMediaEntity, 'publicUrl'> | null | undefined,
  ): Promise<string | null> {
    if (!media?.publicUrl) return null;
    return this.objectStorage.resolveDownloadUrl(media.publicUrl);
  }

  async resolveById(mediaId: string | null | undefined): Promise<string | null> {
    if (!mediaId) return null;
    const media = await this.portalMediaRepo.findOne({ where: { id: mediaId } });
    return this.resolvePublicUrl(media);
  }
}
