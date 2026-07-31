import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  PHOTO_UPLOAD_REPOSITORY,
} from '../../../common/constants/tokens';
import { PhotoUploadStatus } from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { UpdateProfileDto } from '../dto/f001.dto';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type { IPhotoUploadRepository } from '../interfaces/supporting.repository.interface';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(PHOTO_UPLOAD_REPOSITORY)
    private readonly photoUploadRepository: IPhotoUploadRepository,
  ) {}

  async getMyProfile(userId: string) {
    const profile = await this.alumniRepository.findByUserId(userId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni profile for user', userId);
    }
    return this.toResponse(profile);
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.alumniRepository.findByUserId(userId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni profile for user', userId);
    }

    let photoUrl = profile.personal?.photoUrl ?? profile.alumni.alumniPhoto;
    if (dto.upload_id) {
      const upload = await this.photoUploadRepository.findById(dto.upload_id);
      if (!upload || upload.status !== PhotoUploadStatus.TEMP) {
        throw new BusinessException('Photo upload is not available');
      }
      if (upload.expiresAt.getTime() < Date.now()) {
        throw new BusinessException('Photo upload has expired');
      }
      await this.photoUploadRepository.markAttached(upload.id);
      photoUrl = upload.publicUrl;
      await this.alumniRepository.updateAlumni(profile.alumni.id, {
        alumniPhoto: photoUrl,
      });
    }

    await this.alumniRepository.upsertPersonal(profile.alumni.id, {
      phoneNumber: dto.phone_number,
      address: dto.address,
      city: dto.city,
      country: dto.country,
      gender: dto.gender,
      dateOfBirth: dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
      photoUrl: photoUrl ?? undefined,
    });

    await this.alumniRepository.upsertProfessional(profile.alumni.id, {
      currentCompany: dto.current_company,
      jobTitle: dto.job_title,
      industry: dto.industry,
      yearsOfExperience: dto.years_of_experience,
      linkedinUrl: dto.linkedin_url,
    });

    this.logger.log(`ALUMNI_PROFILE_UPDATED alumniId=${profile.alumni.id}`);

    const updated = await this.alumniRepository.findById(profile.alumni.id);
    return this.toResponse(updated!);
  }

  private toResponse(profile: NonNullable<
    Awaited<ReturnType<IAlumniRepository['findById']>>
  >) {
    const personal = profile.personal;
    const professional = profile.professional;
    const filled = [
      personal?.phoneNumber,
      personal?.address,
      personal?.city,
      personal?.country,
      personal?.gender,
      personal?.dateOfBirth,
      personal?.photoUrl ?? profile.alumni.alumniPhoto,
      professional?.currentCompany,
      professional?.jobTitle,
      professional?.industry,
      professional?.linkedinUrl,
    ].filter((v) => v !== null && v !== undefined && v !== '').length;

    return {
      alumni_id: profile.alumni.id,
      registration_ref: profile.alumni.registrationRef,
      full_name: profile.alumni.fullName,
      email: profile.alumni.email,
      status: profile.alumni.status,
      alumni_photo: profile.alumni.alumniPhoto,
      alumni_qr_code: profile.alumni.alumniQrCode,
      academic: {
        campus: profile.academic.campus,
        degree: profile.academic.degree,
        roll_number: profile.academic.rollNumber,
        graduation_year: profile.academic.graduationYear,
        cgpa: profile.academic.cgpa,
        read_only: true,
      },
      personal: personal
        ? {
            phone_number: personal.phoneNumber,
            address: personal.address,
            city: personal.city,
            country: personal.country,
            gender: personal.gender,
            date_of_birth: personal.dateOfBirth,
            photo_url: personal.photoUrl,
          }
        : null,
      professional: professional
        ? {
            current_company: professional.currentCompany,
            job_title: professional.jobTitle,
            industry: professional.industry,
            years_of_experience: professional.yearsOfExperience,
            linkedin_url: professional.linkedinUrl,
          }
        : null,
      profile_completion_pct: Math.round((filled / 11) * 100),
    };
  }
}
