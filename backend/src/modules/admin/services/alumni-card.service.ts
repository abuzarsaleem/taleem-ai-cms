import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_CARD_GENERATOR,
  ALUMNI_REPOSITORY,
} from '../../../common/constants/tokens';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import { GenerateAlumniCardDto } from '../dto/generate-alumni-card.dto';
import type { IAlumniCardGenerator } from '../interfaces/alumni-card-generator.interface';

@Injectable()
export class AlumniCardService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(ALUMNI_CARD_GENERATOR)
    private readonly cardGenerator: IAlumniCardGenerator,
  ) {}

  async generate(alumniId: string, dto: GenerateAlumniCardDto) {
    const profile = await this.alumniRepository.findById(alumniId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni', alumniId);
    }

    const generated = await this.cardGenerator.generate(profile, {
      photoUrl: dto.photoUrl,
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
