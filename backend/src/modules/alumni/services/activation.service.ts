import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  NOTIFICATION_SENDER,
  USER_REPOSITORY,
  VERIFICATION_TOKEN_REPOSITORY,
} from '../../../common/constants/tokens';
import { UserRole, VerificationTokenType } from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { INotificationSender } from '../../../common/interfaces/notification-sender.interface';
import { generateRawToken, hashToken } from '../../../common/utils';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type { IUserRepository } from '../interfaces/user.repository.interface';
import type { IVerificationTokenRepository } from '../interfaces/supporting.repository.interface';

const ACTIVATION_TTL_HOURS = 48;
const POST_ACTIVATION_RESET_TTL_HOURS = 1;

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
  ) {}

  async issueActivationToken(input: {
    userId: string;
    alumniId: string;
    email: string;
    fullName: string;
    templateId: 'activation_link' | 'approval_with_activation_link' | 'resend_activation';
  }): Promise<string> {
    await this.tokenRepository.invalidateActiveForUser(
      input.userId,
      VerificationTokenType.ACTIVATION,
    );

    const rawToken = generateRawToken();
    const expiresAt = new Date(
      Date.now() + ACTIVATION_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.tokenRepository.create({
      userId: input.userId,
      alumniId: input.alumniId,
      tokenHash: hashToken(rawToken),
      tokenType: VerificationTokenType.ACTIVATION,
      expiresAt,
    });

    const baseUrl =
      process.env.ALUMNI_PORTAL_URL ?? 'http://localhost:5173/activate';
    const activationLink = `${baseUrl}?token=${rawToken}`;

    await this.notificationSender.send({
      to: input.email,
      templateId: input.templateId,
      variables: {
        fullName: input.fullName,
        activationLink,
      },
    });

    return rawToken;
  }

  /**
   * Validates the email activation token, activates the account, and returns a
   * one-time password-reset token for POST /auth/reset-password.
   */
  async activate(token: string) {
    const record = await this.tokenRepository.findValidByHash(
      hashToken(token),
      VerificationTokenType.ACTIVATION,
    );
    if (!record) {
      throw new BusinessException('Invalid or expired activation token');
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new ResourceNotFoundException('User', record.userId);
    }

    if (user.isActive) {
      throw new BusinessException('Account is already activated');
    }

    await this.userRepository.update(user.id, {
      isActive: true,
      role: UserRole.ALUMNI,
    });
    await this.tokenRepository.markUsed(record.id);

    await this.tokenRepository.invalidateActiveForUser(
      user.id,
      VerificationTokenType.PASSWORD_RESET,
    );

    const resetToken = generateRawToken();
    await this.tokenRepository.create({
      userId: user.id,
      alumniId: record.alumniId,
      tokenHash: hashToken(resetToken),
      tokenType: VerificationTokenType.PASSWORD_RESET,
      expiresAt: new Date(
        Date.now() + POST_ACTIVATION_RESET_TTL_HOURS * 60 * 60 * 1000,
      ),
    });

    this.logger.log(`ALUMNI_ACCOUNT_ACTIVATED userId=${user.id}`);

    return {
      user_id: user.id,
      email: user.email,
      activated: true,
      reset_token: resetToken,
    };
  }

  async resendActivation(email: string) {
    const alumni = await this.alumniRepository.findByEmail(email);
    if (!alumni?.alumni.userId) {
      throw new BusinessException(
        'No approved alumni account found for activation resend',
      );
    }

    const user = await this.userRepository.findById(alumni.alumni.userId);
    if (!user) {
      throw new ResourceNotFoundException('User', alumni.alumni.userId);
    }
    if (user.isActive) {
      throw new BusinessException('Account is already activated');
    }

    await this.issueActivationToken({
      userId: user.id,
      alumniId: alumni.alumni.id,
      email: user.email,
      fullName: alumni.alumni.fullName,
      templateId: 'resend_activation',
    });

    return { resent: true };
  }
}
