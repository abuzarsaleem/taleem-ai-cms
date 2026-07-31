import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NOTIFICATION_SENDER,
  PHOTO_UPLOAD_REPOSITORY,
  REGISTRATION_REQUEST_REPOSITORY,
} from '../../../common/constants/tokens';
import { PhotoUploadStatus, RegistrationStatus } from '../../../common/enums';
import {
  BusinessException,
  ConflictException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { RegisterDto } from '../dto/f001.dto';
import type { IRegistrationRequestRepository } from '../interfaces/registration-request.repository.interface';
import type { IPhotoUploadRepository } from '../interfaces/supporting.repository.interface';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    @Inject(PHOTO_UPLOAD_REPOSITORY)
    private readonly photoUploadRepository: IPhotoUploadRepository,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Validate duplicate email (active/pending application)
    const existing = await this.registrationRepository.findByEmail(dto.email);
    if (existing && existing.status !== RegistrationStatus.REJECTED) {
      throw new ConflictException(
        'A registration request already exists for this email',
      );
    }

    // 2. Attach photo if provided
    let photoUrl: string | null = null;
    if (dto.upload_id) {
      const upload = await this.photoUploadRepository.findById(dto.upload_id);
      if (!upload) {
        throw new ResourceNotFoundException('Photo upload', dto.upload_id);
      }
      if (upload.status !== PhotoUploadStatus.TEMP) {
        throw new BusinessException('Photo upload is not available');
      }
      if (upload.expiresAt.getTime() < Date.now()) {
        throw new BusinessException('Photo upload has expired');
      }
      await this.photoUploadRepository.markAttached(upload.id);
      photoUrl = upload.publicUrl;
    }

    // 3. Create registration request (PENDING — awaits admin verification)
    const created = await this.registrationRepository.create({
      fullName: dto.full_name,
      email: dto.email,
      phoneNumber: dto.phone_number,
      campus: dto.campus,
      degree: dto.degree,
      rollNumber: dto.roll_number,
      graduationYear: dto.graduation_year,
      cgpa: dto.cgpa,
    });

    this.logger.log(
      `ALUMNI_REGISTER_SUBMITTED requestId=${created.id} email=${created.email} photoAttached=${Boolean(photoUrl)}`,
    );

    // 4. Acknowledge (institutional verification is async / admin-driven)
    return {
      registration_id: created.id,
      status: created.status,
      submitted_at: created.submittedAt,
      photo_url: photoUrl,
      message:
        'Registration submitted and pending institutional verification',
    };
  }
}
