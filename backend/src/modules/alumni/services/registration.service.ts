import { Inject, Injectable, Logger } from '@nestjs/common';
import {
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
    const existingEmail = await this.registrationRepository.findByEmail(
      dto.email,
    );
    if (existingEmail && existingEmail.status !== RegistrationStatus.REJECTED) {
      throw new ConflictException(
        'A registration request already exists for this email',
      );
    }

    const existingCnic = await this.registrationRepository.findByCnic(
      dto.cnic_national_id,
    );
    if (existingCnic && existingCnic.status !== RegistrationStatus.REJECTED) {
      throw new ConflictException(
        'A registration request already exists for this CNIC',
      );
    }

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

    const created = await this.registrationRepository.create({
      fullName: dto.full_name,
      email: dto.email,
      phoneNumber: dto.phone_number,
      whatsappNumber: dto.whatsapp_number,
      cnicNationalId: dto.cnic_national_id,
      degreeProgramId: dto.degree_program_id,
      registrationRollNumber: dto.registration_roll_number,
      graduationYear: dto.graduation_year,
      photoUrl,
    });

    this.logger.log(
      `ALUMNI_REGISTER_SUBMITTED requestId=${created.id} email=${created.email}`,
    );

    return {
      registration_id: created.id,
      status: created.status,
      submitted_at: created.createdAt,
      photo_url: created.photoUrl,
      message:
        'Registration submitted and pending institutional verification',
    };
  }
}
