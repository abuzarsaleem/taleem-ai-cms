import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  REGISTRATION_REQUEST_REPOSITORY,
} from '../../../common/constants/tokens';
import { RegistrationStatus } from '../../../common/enums';
import { ResourceNotFoundException } from '../../../common/exceptions';
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
      recent_pending: pending.slice(0, 5).map((r) => this.toListItem(r)),
    };
  }

  async list(status?: RegistrationStatus) {
    const items = await this.registrationRepository.findAll(status);
    return items.map((item) => this.toListItem(item));
  }

  async detail(registrationId: string) {
    const request =
      await this.registrationRepository.findById(registrationId);
    if (!request) {
      throw new ResourceNotFoundException('Registration', registrationId);
    }

    const alumni =
      await this.alumniRepository.findByRegistrationRequestId(registrationId);

    return {
      ...this.toListItem(request),
      rejection_reason: request.rejectionReason,
      reviewed_by: request.reviewedBy,
      reviewed_at: request.reviewedAt,
      alumni: alumni
        ? {
            alumni_id: alumni.alumni.id,
            registration_ref: alumni.alumni.registrationRef,
            status: alumni.alumni.status,
            user_id: alumni.alumni.userId,
          }
        : null,
    };
  }

  async resendNotification(registrationId: string) {
    const request =
      await this.registrationRepository.findById(registrationId);
    if (!request) {
      throw new ResourceNotFoundException('Registration', registrationId);
    }

    if (request.status === RegistrationStatus.APPROVED) {
      const alumni =
        await this.alumniRepository.findByRegistrationRequestId(
          registrationId,
        );
      if (!alumni?.alumni.userId) {
        throw new ResourceNotFoundException('Alumni for registration', registrationId);
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

    if (request.status === RegistrationStatus.REJECTED) {
      // Rejection resend would go through NotificationSender; reuse RejectionService path simply:
      return {
        resent: false,
        message: 'Use reject flow reason already stored; call notification manually if needed',
      };
    }

    throw new ResourceNotFoundException(
      'Approved/rejected registration for resend',
      registrationId,
    );
  }

  private toListItem(request: AlumniRegistrationRequest) {
    return {
      registration_id: request.id,
      full_name: request.fullName,
      email: request.email,
      phone_number: request.phoneNumber,
      status: request.status,
      submitted_at: request.submittedAt,
      campus: request.campus,
      degree: request.degree,
      roll_number: request.rollNumber,
      graduation_year: request.graduationYear,
      cgpa: request.cgpa,
    };
  }
}
