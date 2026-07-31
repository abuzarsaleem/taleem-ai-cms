import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  REGISTRATION_REQUEST_REPOSITORY,
} from '../../../common/constants/tokens';
import { RegistrationStatus } from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { generateRegistrationRef } from '../../../common/utils';
import { AlumniProfileResponseDto } from '../../alumni/dto/alumni-response.dto';
import { RegistrationRequestResponseDto } from '../../alumni/dto/registration-request-response.dto';
import { AlumniRegistrationRequest } from '../../alumni/entities/alumni-registration-request.entity';
import { AlumniProfile } from '../../alumni/entities/alumni.entity';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import type { IRegistrationRequestRepository } from '../../alumni/interfaces/registration-request.repository.interface';
import { ReviewRegistrationDto } from '../dto/review-registration.dto';

@Injectable()
export class AdminRegistrationService {
  constructor(
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
  ) {}

  async listRequests(
    status?: RegistrationStatus,
  ): Promise<RegistrationRequestResponseDto[]> {
    const items = await this.registrationRepository.findAll(status);
    return items.map((item) => this.toRequestResponse(item));
  }

  async review(
    requestId: string,
    dto: ReviewRegistrationDto,
  ): Promise<{
    request: RegistrationRequestResponseDto;
    alumni?: AlumniProfileResponseDto;
  }> {
    if (
      dto.status !== RegistrationStatus.APPROVED &&
      dto.status !== RegistrationStatus.REJECTED
    ) {
      throw new BusinessException('Review status must be APPROVED or REJECTED');
    }

    if (
      dto.status === RegistrationStatus.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BusinessException(
        'rejectionReason is required when rejecting a request',
      );
    }

    const existing = await this.registrationRepository.findById(requestId);
    if (!existing) {
      throw new ResourceNotFoundException('Registration request', requestId);
    }

    if (existing.status !== RegistrationStatus.PENDING) {
      throw new BusinessException(
        `Request is already ${existing.status} and cannot be reviewed again`,
      );
    }

    const reviewedAt = new Date();
    const updated = await this.registrationRepository.update(requestId, {
      status: dto.status,
      reviewedBy: dto.reviewedBy,
      reviewedAt,
      rejectionReason:
        dto.status === RegistrationStatus.REJECTED
          ? dto.rejectionReason!.trim()
          : null,
    });

    if (dto.status === RegistrationStatus.REJECTED) {
      return { request: this.toRequestResponse(updated) };
    }

    const profile = await this.alumniRepository.create({
      registrationRequestId: updated.id,
      registrationRef: generateRegistrationRef(),
      fullName: updated.fullName,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
      academic: {
        campus: updated.campus,
        degree: updated.degree,
        rollNumber: updated.rollNumber,
        graduationYear: updated.graduationYear,
        cgpa: updated.cgpa,
      },
    });

    return {
      request: this.toRequestResponse(updated),
      alumni: this.toAlumniResponse(profile),
    };
  }

  private toRequestResponse(
    entity: AlumniRegistrationRequest,
  ): RegistrationRequestResponseDto {
    return {
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      submittedAt: entity.submittedAt,
      reviewedBy: entity.reviewedBy,
      reviewedAt: entity.reviewedAt,
      rejectionReason: entity.rejectionReason,
      campus: entity.campus,
      degree: entity.degree,
      rollNumber: entity.rollNumber,
      graduationYear: entity.graduationYear,
      cgpa: entity.cgpa,
    };
  }

  private toAlumniResponse(profile: AlumniProfile): AlumniProfileResponseDto {
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
