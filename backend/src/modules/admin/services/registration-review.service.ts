import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  PHOTO_STORAGE,
  REGISTRATION_REQUEST_REPOSITORY,
} from '../../../common/constants/tokens';
import { RegistrationStatus } from '../../../common/enums';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import { ActivationService } from '../../alumni/services/activation.service';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import type { IRegistrationRequestRepository } from '../../alumni/interfaces/registration-request.repository.interface';
import { AlumniRegistrationRequest } from '../../alumni/entities/alumni-registration-request.entity';

@Injectable()
export class RegistrationReviewService {
  constructor(
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(PHOTO_STORAGE)
    private readonly objectStorage: IObjectStorage,
    private readonly activationService: ActivationService,
  ) {}

  async dashboard() {
    const all = await this.registrationRepository.findAll();
    const pending = all.filter((r) => r.status === RegistrationStatus.PENDING);
    const approved = all.filter(
      (r) => r.status === RegistrationStatus.APPROVED,
    );
    const rejected = all.filter(
      (r) => r.status === RegistrationStatus.REJECTED,
    );
    const alumni = await this.alumniRepository.findAll();

    return {
      pending_count: pending.length,
      approved_count: approved.length,
      rejected_count: rejected.length,
      alumni_count: alumni.length,
      recent_pending: await Promise.all(
        pending.slice(0, 5).map((r) => this.toListItem(r)),
      ),
    };
  }

  async list(status?: RegistrationStatus) {
    const items = await this.registrationRepository.findAll(status);
    return Promise.all(items.map((item) => this.toListItem(item)));
  }

  async detail(registrationId: string) {
    const request = await this.registrationRepository.findById(registrationId);
    if (!request) {
      throw new ResourceNotFoundException('Registration', registrationId);
    }

    const alumni =
      await this.alumniRepository.findByRegistrationRequestId(registrationId);

    const base = await this.toListItem(request);
    const qrDurable = alumni?.alumni.qrCode || null;
    const photoDurable =
      alumni?.alumni.photoUrl || request.photoUrl || null;

    return {
      ...base,
      whatsapp_number: request.whatsappNumber,
      rejection_reason: request.rejectionReason,
      reviewed_by: request.reviewedBy,
      reviewed_at: request.reviewedAt,
      photo_url: photoDurable
        ? await this.objectStorage.resolveDownloadUrl(photoDurable)
        : null,
      alumni: alumni
        ? {
            alumni_id: alumni.alumni.id,
            status: alumni.alumni.status,
            user_id: alumni.alumni.userId,
            photo_url: alumni.alumni.photoUrl
              ? await this.objectStorage.resolveDownloadUrl(
                  alumni.alumni.photoUrl,
                )
              : null,
            qr_code: qrDurable
              ? await this.objectStorage.resolveDownloadUrl(qrDurable)
              : null,
          }
        : null,
    };
  }

  async resendNotification(registrationId: string) {
    const request = await this.registrationRepository.findById(registrationId);
    if (!request) {
      throw new ResourceNotFoundException('Registration', registrationId);
    }

    if (request.status === RegistrationStatus.APPROVED) {
      const alumni =
        await this.alumniRepository.findByRegistrationRequestId(
          registrationId,
        );
      if (!alumni?.alumni.userId) {
        throw new ResourceNotFoundException(
          'Alumni for registration',
          registrationId,
        );
      }
      await this.activationService.issueActivationToken({
        userId: alumni.alumni.userId,
        alumniId: alumni.alumni.id,
        email: alumni.alumni.email,
        fullName: alumni.alumni.fullName,
        templateId: 'approval_with_activation_link',
      });
      return { resent: true, type: 'approval_activation' };
    }

    throw new ResourceNotFoundException(
      'Approved registration for resend',
      registrationId,
    );
  }

  private async toListItem(request: AlumniRegistrationRequest) {
    return {
      registration_id: request.id,
      full_name: request.fullName,
      email: request.email,
      phone_number: request.phoneNumber,
      status: request.status,
      submitted_at: request.createdAt,
      degree_program_id: request.degreeProgramId,
      registration_roll_number: request.registrationRollNumber,
      graduation_year: request.graduationYear,
      cnic_national_id: request.cnicNationalId,
      photo_url: request.photoUrl
        ? await this.objectStorage.resolveDownloadUrl(request.photoUrl)
        : null,
    };
  }
}
