import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus, UserRole } from '../../../common/enums';

export class AuthTokenResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  user_id: string;
}

export class RegisterResponseDto {
  @ApiProperty()
  registration_id: string;

  @ApiProperty({
    example: 'ALM-2026-0003847',
    description: 'Human-readable registration / lifelong alumni code',
  })
  reference_number: string;

  @ApiProperty({ enum: RegistrationStatus })
  status: RegistrationStatus;

  @ApiProperty()
  submitted_at: Date;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiProperty()
  message: string;
}

export class ResendActivationResponseDto {
  @ApiProperty({ example: true })
  resent: boolean;
}

export class ActivateAccountResponseDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ example: true })
  activated: boolean;

  @ApiProperty({
    description:
      'Password reset token — pass this to POST /auth/reset-password to set a password',
  })
  reset_token: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty()
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ example: true })
  reset: boolean;
}
