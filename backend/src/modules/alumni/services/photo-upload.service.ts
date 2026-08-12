import { Injectable } from '@nestjs/common';
import { PortalMediaType } from '../../../common/enums';
import { UploadPhotoResponseDto } from '../dto/f001.dto';
import { PortalMediaService } from '../../media/portal-media.service';

@Injectable()
export class PhotoUploadService {
  constructor(private readonly portalMediaService: PortalMediaService) {}

  async uploadTemp(file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }): Promise<UploadPhotoResponseDto> {
    return this.portalMediaService.uploadImage(
      file,
      PortalMediaType.REGISTRATION_PHOTO,
      'registration-photos',
    );
  }
}
