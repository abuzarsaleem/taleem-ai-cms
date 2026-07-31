import { Injectable, Inject } from '@nestjs/common';
import { ALUMNI_REPOSITORY } from '../../../common/constants/tokens';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { AlumniProfileResponseDto } from '../dto/alumni-response.dto';
import { AlumniProfile } from '../entities/alumni.entity';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';

@Injectable()
export class AlumniService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
  ) {}

  async getById(id: string): Promise<AlumniProfileResponseDto> {
    const profile = await this.alumniRepository.findById(id);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni', id);
    }
    return this.toResponse(profile);
  }

  async list(): Promise<AlumniProfileResponseDto[]> {
    const profiles = await this.alumniRepository.findAll();
    return profiles.map((profile) => this.toResponse(profile));
  }

  private toResponse(profile: AlumniProfile): AlumniProfileResponseDto {
    return {
      id: profile.alumni.id,
      registrationRef: profile.alumni.registrationRef,
      status: profile.alumni.status,
      fullName: profile.alumni.fullName,
      email: profile.alumni.email,
      alumniPhoto: profile.alumni.alumniPhoto,
      alumniQrCode: profile.alumni.alumniQrCode,
      academic: {
        campus: profile.academic.campus,
        degree: profile.academic.degree,
        rollNumber: profile.academic.rollNumber,
        graduationYear: profile.academic.graduationYear,
        cgpa: profile.academic.cgpa,
      },
    };
  }
}
