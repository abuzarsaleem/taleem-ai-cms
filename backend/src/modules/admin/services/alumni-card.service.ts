import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_CARD_GENERATOR,
  ALUMNI_REPOSITORY,
} from '../../../common/constants/tokens';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { AlumniCardResponseDto } from '../../alumni/dto/alumni-response.dto';
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

  async generate(
    alumniId: string,
    dto: GenerateAlumniCardDto,
  ): Promise<AlumniCardResponseDto> {
    const profile = await this.alumniRepository.findById(alumniId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni', alumniId);
    }

    const generated = await this.cardGenerator.generate(profile, {
      photoUrl: dto.photoUrl,
    });

    const updatedAlumni = await this.alumniRepository.updateAlumni(alumniId, {
      alumniQrCode: generated.qrCodeUrl,
      alumniPhoto: generated.photoUrl,
    });

    return {
      alumniId: updatedAlumni.id,
      registrationRef: updatedAlumni.registrationRef,
      fullName: updatedAlumni.fullName,
      email: updatedAlumni.email,
      status: updatedAlumni.status,
      alumniPhoto: updatedAlumni.alumniPhoto,
      alumniQrCode: updatedAlumni.alumniQrCode,
      academic: {
        campus: profile.academic.campus,
        degree: profile.academic.degree,
        rollNumber: profile.academic.rollNumber,
        graduationYear: profile.academic.graduationYear,
        cgpa: profile.academic.cgpa,
      },
      generatedAt: new Date(),
    };
  }
}
