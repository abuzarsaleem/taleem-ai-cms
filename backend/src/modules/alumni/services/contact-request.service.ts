import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  CONTACT_REQUEST_REPOSITORY,
  NOTIFICATION_SENDER,
} from '../../../common/constants/tokens';
import { ContactRequestStatus } from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { INotificationSender } from '../../../common/interfaces/notification-sender.interface';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type { IContactRequestRepository } from '../interfaces/contact-request.repository.interface';
import { AdminContactReviewAction } from '../dto/contact-request.dto';

@Injectable()
export class ContactRequestService {
  private readonly logger = new Logger(ContactRequestService.name);

  constructor(
    @Inject(CONTACT_REQUEST_REPOSITORY)
    private readonly contactRequestRepository: IContactRequestRepository,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
  ) {}

  async create(viewerUserId: string, targetAlumniId: string, reason: string) {
    const requester = await this.requireAlumniByUser(viewerUserId);
    if (requester.alumni.id === targetAlumniId) {
      throw new BusinessException('Cannot request contact with yourself');
    }

    const target = await this.alumniRepository.findById(targetAlumniId);
    if (!target) {
      throw new ResourceNotFoundException('Alumni', targetAlumniId);
    }

    const existing = await this.contactRequestRepository.findActivePair(
      requester.alumni.id,
      targetAlumniId,
    );
    if (existing) {
      throw new BusinessException(
        `An active contact request already exists (${existing.status})`,
        HttpStatus.CONFLICT,
        'CONTACT_REQUEST_EXISTS',
      );
    }

    const created = await this.contactRequestRepository.create({
      requesterAlumniId: requester.alumni.id,
      targetAlumniId,
      requestReason: reason,
    });

    this.logger.log(
      `CONTACT_REQUEST_CREATED id=${created.id} requester=${requester.alumni.id} target=${targetAlumniId}`,
    );

    return this.toResponse(created);
  }

  async listSent(viewerUserId: string) {
    const requester = await this.requireAlumniByUser(viewerUserId);
    const rows = await this.contactRequestRepository.findSentByRequester(
      requester.alumni.id,
    );
    return rows.map((r) => this.toResponse(r));
  }

  async listForAdmin(status?: ContactRequestStatus) {
    const rows = await this.contactRequestRepository.findAll(status);
    return rows.map((r) => this.toResponse(r));
  }

  async reviewAsAdmin(
    adminUserId: string,
    requestId: string,
    action: AdminContactReviewAction,
    rejectionReason?: string,
  ) {
    const request = await this.contactRequestRepository.findById(requestId);
    if (!request) {
      throw new ResourceNotFoundException('Contact request', requestId);
    }
    if (
      request.status !== ContactRequestStatus.PENDING_ADMIN &&
      request.status !== ContactRequestStatus.PENDING_ALUMNI
    ) {
      throw new BusinessException(
        `Request is not pending review (status=${request.status})`,
        HttpStatus.CONFLICT,
      );
    }

    if (action === AdminContactReviewAction.REJECT && !rejectionReason?.trim()) {
      throw new BusinessException('Rejection reason is required');
    }

    const approved = action === AdminContactReviewAction.APPROVE;
    const updated = await this.contactRequestRepository.update(requestId, {
      status: approved
        ? ContactRequestStatus.APPROVED
        : ContactRequestStatus.REJECTED_BY_ADMIN,
      adminId: adminUserId,
      rejectionReason: approved
        ? null
        : (rejectionReason?.trim() ?? null),
    });

    const requester = await this.alumniRepository.findById(
      request.requesterAlumniId,
    );
    const target = await this.alumniRepository.findById(request.targetAlumniId);
    if (requester && target) {
      try {
        await this.notificationSender.send({
          to: requester.alumni.email,
          templateId: approved
            ? 'contact_request_approved'
            : 'contact_request_rejected',
          variables: {
            fullName: requester.alumni.fullName,
            targetName: target.alumni.fullName,
            reason: request.requestReason,
            rejectionReason: rejectionReason?.trim() ?? '',
          },
        });
      } catch (error) {
        this.logger.error(
          `CONTACT_REQUEST_NOTIFY_FAILED id=${requestId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    this.logger.log(
      `CONTACT_REQUEST_ADMIN_${approved ? 'APPROVED' : 'REJECTED'} id=${requestId}`,
    );

    return this.toResponse(updated);
  }

  private async requireAlumniByUser(userId: string) {
    const profile = await this.alumniRepository.findByUserId(userId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni profile for user', userId);
    }
    return profile;
  }

  private toResponse(row: {
    id: string;
    requesterAlumniId: string;
    targetAlumniId: string;
    requestReason: string;
    status: ContactRequestStatus;
    adminId: string | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      requester_alumni_id: row.requesterAlumniId,
      target_alumni_id: row.targetAlumniId,
      request_reason: row.requestReason,
      status: row.status,
      admin_id: row.adminId,
      rejection_reason: row.rejectionReason,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }
}
