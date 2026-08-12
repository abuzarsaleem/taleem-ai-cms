import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_CARD_GENERATOR,
  ALUMNI_REPOSITORY,
} from '../../../common/constants/tokens';
import { PortalMediaType } from '../../../common/enums';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import { GenerateAlumniCardDto } from '../dto/generate-alumni-card.dto';
import type { IAlumniCardGenerator } from '../interfaces/alumni-card-generator.interface';
import { PortalMediaService } from '../../media/portal-media.service';

@Injectable()
export class AlumniCardService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(ALUMNI_CARD_GENERATOR)
    private readonly cardGenerator: IAlumniCardGenerator,
    private readonly portalMediaService: PortalMediaService,
  ) {}

  async generate(alumniId: string, dto: GenerateAlumniCardDto) {
    const profile = await this.alumniRepository.findById(alumniId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni', alumniId);
    }

    let photoPublicUrl: string | null = null;
    if (dto.media_id) {
      const media = await this.portalMediaService.requireById(dto.media_id);
      if (
        media.mediaType !== PortalMediaType.ALUMNI_PHOTO &&
        media.mediaType !== PortalMediaType.REGISTRATION_PHOTO
      ) {
        throw new ResourceNotFoundException('Alumni photo media', dto.media_id);
      }
      photoPublicUrl = media.publicUrl;
    } else {
      photoPublicUrl = profile.alumni.photoMedia?.publicUrl ?? null;
    }

    const generated = await this.cardGenerator.generate(profile, {
      photoPublicUrl,
    });

    const updated = await this.alumniRepository.updateAlumni(alumniId, {
      qrCode: generated.qrCodeUrl,
    });

    return {
      alumniId: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      status: updated.status,
      qrCode: generated.downloadUrl,
      academic: profile.academic,
      generatedAt: new Date(),
    };
  }
}
