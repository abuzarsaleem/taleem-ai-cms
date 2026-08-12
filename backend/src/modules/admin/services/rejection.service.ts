import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  NOTIFICATION_SENDER,
  REGISTRATION_REQUEST_REPOSITORY,
} from '../../../common/constants/tokens';
import { RegistrationStatus } from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { INotificationSender } from '../../../common/interfaces/notification-sender.interface';
import type { IRegistrationRequestRepository } from '../../alumni/interfaces/registration-request.repository.interface';

@Injectable()
export class RejectionService {
  private readonly logger = new Logger(RejectionService.name);

  constructor(
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
  ) {}

  /**
   * FR-008–010: rejection has no account-creation step (unlike approval).
   */
  async reject(
    registrationId: string,
    adminUserId: string,
    reason: string,
    cnicNationalId: string,
  ) {
    const trimmed = reason?.trim();
    if (!trimmed) {
      throw new BusinessException('Rejection reason is required');
    }

    const request = await this.registrationRepository.findById(registrationId);
    if (!request) {
      throw new ResourceNotFoundException('Registration', registrationId);
    }
    if (request.status !== RegistrationStatus.PENDING) {
      throw new BusinessException(
        `Registration is already ${request.status}`,
        HttpStatus.CONFLICT,
        'ALREADY_REVIEWED',
      );
    }
    if (request.cnicNationalId !== cnicNationalId.trim()) {
      throw new BusinessException(
        'CNIC does not match this registration request',
        HttpStatus.BAD_REQUEST,
        'CNIC_MISMATCH',
      );
    }

    const reviewedAt = new Date();
    await this.registrationRepository.update(registrationId, {
      status: RegistrationStatus.REJECTED,
      reviewedBy: adminUserId,
      reviewedAt,
      rejectionReason: trimmed,
    });

    this.logger.log(
      `REGISTRATION_REJECTED registrationId=${registrationId} by=${adminUserId}`,
    );

    try {
      await this.notificationSender.send({
        to: request.email,
        templateId: 'rejection_with_reason',
        variables: {
          fullName: request.fullName,
          reason: trimmed,
        },
      });
      this.logger.log(`REJECTION_EMAIL_SENT registrationId=${registrationId}`);
      return {
        registration_id: registrationId,
        status: RegistrationStatus.REJECTED,
        rejection_reason: trimmed,
        notification_failed: false,
      };
    } catch {
      this.logger.error(
        `REJECTION_EMAIL_FAILED registrationId=${registrationId}`,
      );
      return {
        registration_id: registrationId,
        status: RegistrationStatus.REJECTED,
        rejection_reason: trimmed,
        notification_failed: true,
      };
    }
  }
}
