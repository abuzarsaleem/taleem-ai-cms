import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  REGISTRATION_REQUEST_REPOSITORY,
  USER_REPOSITORY,
} from '../../../common/constants/tokens';
import { RegistrationStatus, UserRole } from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { placeholderPasswordHash } from '../../../common/utils';
import { ActivationService } from '../../alumni/services/activation.service';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import type { IRegistrationRequestRepository } from '../../alumni/interfaces/registration-request.repository.interface';
import type { IUserRepository } from '../../alumni/interfaces/user.repository.interface';
import { AlumniCardService } from './alumni-card.service';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly activationService: ActivationService,
    private readonly alumniCardService: AlumniCardService,
  ) {}

  async approve(
    registrationId: string,
    adminUserId: string,
    cnicNationalId: string,
  ) {
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

    let alumniId = '';
    let userId = '';
    let qrCode: string | null = null;
    let qrFailed = false;

    try {
      await this.registrationRepository.update(registrationId, {
        status: RegistrationStatus.APPROVED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: null,
      });

      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser?.isActive) {
        throw new BusinessException(
          'An active user already exists for this email',
          HttpStatus.CONFLICT,
        );
      }

      const user =
        existingUser ??
        (await this.userRepository.create({
          email: request.email,
          passwordHash: await placeholderPasswordHash(),
          role: UserRole.ALUMNI,
          isActive: false,
        }));

      userId = user.id;

      const profile = await this.alumniRepository.create({
        registrationRequestId: request.id,
        fullName: request.fullName,
        email: request.email,
        userId: user.id,
        phoneNumber: request.phoneNumber,
        whatsappNumber: request.whatsappNumber,
        cnicNationalId: request.cnicNationalId,
        photoMediaId: request.photoMediaId,
        academic: {
          degreeProgramId: request.degreeProgramId,
          registrationRollNumber: request.registrationRollNumber,
          graduationYear: request.graduationYear,
          registrationYear: null,
        },
      });
      alumniId = profile.alumni.id;

      this.logger.log(
        `REGISTRATION_APPROVED registrationId=${registrationId} alumniId=${alumniId} by=${adminUserId}`,
      );
      this.logger.log(
        `USER_ACCOUNT_CREATED_ON_APPROVAL userId=${userId} alumniId=${alumniId}`,
      );
    } catch (error) {
      this.logger.error(
        `REGISTRATION_APPROVAL_FAILED registrationId=${registrationId}`,
      );
      throw error;
    }

    try {
      const card = await this.alumniCardService.generate(alumniId, {
        media_id: request.photoMediaId ?? undefined,
      });
      qrCode = card.qrCode;
      this.logger.log(`APPROVAL_QR_GENERATED alumniId=${alumniId}`);
    } catch (error) {
      qrFailed = true;
      this.logger.error(
        `APPROVAL_QR_FAILED alumniId=${alumniId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    try {
      await this.activationService.issueActivationToken({
        userId,
        alumniId,
        email: request.email,
        fullName: request.fullName,
        templateId: 'approval_with_activation_link',
      });
      this.logger.log(`APPROVAL_EMAIL_SENT alumniId=${alumniId}`);
      return {
        registration_id: registrationId,
        alumni_id: alumniId,
        user_id: userId,
        status: RegistrationStatus.APPROVED,
        qr_code: qrCode,
        qr_failed: qrFailed,
        notification_failed: false,
      };
    } catch {
      this.logger.error(`APPROVAL_EMAIL_FAILED alumniId=${alumniId}`);
      return {
        registration_id: registrationId,
        alumni_id: alumniId,
        user_id: userId,
        status: RegistrationStatus.APPROVED,
        qr_code: qrCode,
        qr_failed: qrFailed,
        notification_failed: true,
      };
    }
  }
}
