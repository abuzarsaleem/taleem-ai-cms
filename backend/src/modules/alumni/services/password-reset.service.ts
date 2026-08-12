import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  NOTIFICATION_SENDER,
  USER_REPOSITORY,
  VERIFICATION_TOKEN_REPOSITORY,
} from '../../../common/constants/tokens';
import { AlumniStatus, VerificationTokenType } from '../../../common/enums';
import { BusinessException } from '../../../common/exceptions';
import type { INotificationSender } from '../../../common/interfaces/notification-sender.interface';
import {
  generateRawToken,
  hashPassword,
  hashToken,
} from '../../../common/utils';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type { IUserRepository } from '../interfaces/user.repository.interface';
import type { IVerificationTokenRepository } from '../interfaces/supporting.repository.interface';
import { PasswordCryptoService } from '../../auth/password-crypto.service';

const RESET_TTL_HOURS = 1;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
    private readonly passwordCryptoService: PasswordCryptoService,
  ) {}

  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    try {
      const profile = await this.alumniRepository.findByEmail(normalized);
      if (
        profile?.alumni.userId &&
        profile.alumni.status === AlumniStatus.ACTIVE
      ) {
        const user = await this.userRepository.findById(profile.alumni.userId);
        if (user?.isActive) {
          await this.tokenRepository.invalidateActiveForUser(
            user.id,
            VerificationTokenType.PASSWORD_RESET,
          );

          const rawToken = generateRawToken();
          const expiresAt = new Date(
            Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000,
          );

          await this.tokenRepository.create({
            userId: user.id,
            alumniId: profile.alumni.id,
            tokenHash: hashToken(rawToken),
            tokenType: VerificationTokenType.PASSWORD_RESET,
            expiresAt,
          });

          const portalBase =
            process.env.ALUMNI_PORTAL_URL ?? 'http://localhost:5173';
          const resetBase = portalBase.includes('reset-password')
            ? portalBase
            : `${portalBase.replace(/\/$/, '')}/reset-password`;
          const resetLink = `${resetBase}?token=${rawToken}`;

          await this.notificationSender.send({
            to: user.email,
            templateId: 'password_reset',
            variables: {
              fullName: profile.alumni.fullName,
              resetLink,
            },
          });

          this.logger.log(`PASSWORD_RESET_SENT userId=${user.id}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `PASSWORD_RESET_FAILED email=${normalized}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    const plainPassword = this.passwordCryptoService.decryptPassword(password);
    const record = await this.tokenRepository.findValidByHash(
      hashToken(token),
      VerificationTokenType.PASSWORD_RESET,
    );
    if (!record) {
      throw new BusinessException('Invalid or expired password reset token');
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user || !user.isActive) {
      throw new BusinessException('Invalid or expired password reset token');
    }

    await this.userRepository.update(user.id, {
      passwordHash: await hashPassword(plainPassword),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await this.tokenRepository.markUsed(record.id);

    this.logger.log(`PASSWORD_RESET_COMPLETED userId=${user.id}`);

    return { user_id: user.id, email: user.email, reset: true };
  }
}
