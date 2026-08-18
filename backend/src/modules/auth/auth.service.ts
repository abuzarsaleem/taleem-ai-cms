import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpStatus } from '@nestjs/common';
import {
  REGISTRATION_REQUEST_REPOSITORY,
  USER_REPOSITORY,
} from '../../common/constants/tokens';
import { RegistrationStatus, UserRole } from '../../common/enums';
import { BusinessException } from '../../common/exceptions';
import { hashPassword, verifyPassword } from '../../common/utils';
import type { IRegistrationRequestRepository } from '../alumni/interfaces/registration-request.repository.interface';
import type { IUserRepository } from '../alumni/interfaces/user.repository.interface';
import { PasswordCryptoService } from './password-crypto.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    private readonly jwtService: JwtService,
    private readonly passwordCryptoService: PasswordCryptoService,
  ) {}

  async onModuleInit(): Promise<void> {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@taleem.local';
    const existing = await this.userRepository.findByEmail(adminEmail);
    if (!existing) {
      await this.userRepository.create({
        email: adminEmail,
        passwordHash: await hashPassword(
          process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
        ),
        role: UserRole.ADMIN,
        isActive: true,
      });
    }
  }

  async login(
    email: string,
    password: string,
    allowedRoles?: UserRole[],
  ): Promise<{ accessToken: string; role: UserRole; userId: string }> {
    const plainPassword = this.passwordCryptoService.decryptPassword(password);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const registration = await this.registrationRepository.findByEmail(email);
      if (registration?.status === RegistrationStatus.PENDING) {
        throw new BusinessException(
          'Your registration is pending admin approval. You will be notified by email once it is reviewed.',
          HttpStatus.FORBIDDEN,
          'REGISTRATION_PENDING',
        );
      }
      if (registration?.status === RegistrationStatus.REJECTED) {
        throw new BusinessException(
          'Your registration was rejected. Please contact the alumni office for help.',
          HttpStatus.FORBIDDEN,
          'REGISTRATION_REJECTED',
        );
      }
      if (registration?.status === RegistrationStatus.APPROVED) {
        throw new BusinessException(
          'Your account is approved but not activated yet. Check your email for the activation link.',
          HttpStatus.FORBIDDEN,
          'ACCOUNT_INACTIVE',
        );
      }
      throw new BusinessException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
      );
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new BusinessException(
        'Account temporarily locked',
        HttpStatus.LOCKED,
        'ACCOUNT_LOCKED',
      );
    }

    if (!user.isActive) {
      throw new BusinessException(
        'Your account is not active. Check your email for the activation link.',
        HttpStatus.FORBIDDEN,
        'ACCOUNT_INACTIVE',
      );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new BusinessException(
        'Not authorized for this portal',
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
      );
    }

    const valid = await verifyPassword(plainPassword, user.passwordHash);
    if (!valid) {
      const failed = user.failedLoginAttempts + 1;
      const patch: Partial<typeof user> = { failedLoginAttempts: failed };
      if (failed >= MAX_FAILED_ATTEMPTS) {
        patch.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
        patch.failedLoginAttempts = 0;
      }
      await this.userRepository.update(user.id, patch);
      throw new BusinessException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
      );
    }

    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, role: user.role, userId: user.id };
  }
}
