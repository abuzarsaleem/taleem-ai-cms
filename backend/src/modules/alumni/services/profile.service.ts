import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  PHOTO_STORAGE,
} from '../../../common/constants/tokens';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import { UpdateProfileDto } from '../dto/f001.dto';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import { PortalMediaService } from '../../media/portal-media.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(PHOTO_STORAGE) private readonly objectStorage: IObjectStorage,
    private readonly portalMediaService: PortalMediaService,
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

    await this.alumniRepository.updateAlumni(profile.alumni.id, {
      phoneNumber: dto.phone_number,
      whatsappNumber: dto.whatsapp_number,
      address: dto.address,
      secondryAddress: dto.secondry_address,
      city: dto.city,
      country: dto.country,
      gender: dto.gender,
      dateOfBirth: dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
      linkedinUrl: dto.linkedin_url,
    });

    this.logger.log(`ALUMNI_PROFILE_UPDATED alumniId=${profile.alumni.id}`);
    const updated = await this.alumniRepository.findById(profile.alumni.id);
    return this.toResponse(updated!);
  }

  private async toResponse(
    profile: NonNullable<Awaited<ReturnType<IAlumniRepository['findById']>>>,
  ) {
    const a = profile.alumni;
    const qrCode = a.qrCode
      ? await this.objectStorage.resolveDownloadUrl(a.qrCode)
      : a.qrCode;
    const photoUrl = await this.portalMediaService.resolvePublicUrl(
      a.photoMedia,
    );

    return {
      alumni_id: a.id,
      full_name: a.fullName,
      email: a.email,
      status: a.status,
      phone_number: a.phoneNumber,
      whatsapp_number: a.whatsappNumber,
      cnic_national_id: a.cnicNationalId,
      address: a.address,
      secondry_address: a.secondryAddress,
      city: a.city,
      country: a.country,
      gender: a.gender,
      date_of_birth: a.dateOfBirth,
      linkedin_url: a.linkedinUrl,
      photo_url: photoUrl,
      qr_code: qrCode,
      academic: this.mapAcademic(profile.academic),
      professional: this.mapProfessional(profile.professional),
    };
  }

  private mapAcademic(
    rows: NonNullable<
      Awaited<ReturnType<IAlumniRepository['findById']>>
    >['academic'],
  ) {
    const verificationId = [...rows].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )[0]?.id;

    return rows.map((row) => ({
      id: row.id,
      degree_program_id: row.degreeProgramId,
      registration_roll_number: row.registrationRollNumber,
      registration_year: row.registrationYear,
      graduation_year: row.graduationYear,
      cgpa: row.cgpa,
      is_verification: row.id === verificationId,
    }));
  }

  private mapProfessional(
    rows: NonNullable<
      Awaited<ReturnType<IAlumniRepository['findById']>>
    >['professional'],
  ) {
    return rows.map((row) => ({
      id: row.id,
      current_company: row.currentCompany,
      job_title: row.jobTitle,
      role: row.role,
      start_date: row.startDate,
      end_date: row.endDate,
    }));
  }
}
