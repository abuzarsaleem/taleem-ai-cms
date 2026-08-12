import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  AnnouncementCategory,
  RegistrationStatus,
} from '../../../common/enums';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@taleem.local' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'base64-rsa-oaep-encrypted-password',
    description:
      'Base64 RSA-OAEP encrypted password using GET /admin/auth/password-public-key',
  })
  @IsString()
  @MinLength(1)
  password: string;
}

export class ReviewRegistrationDto {
  @ApiProperty({
    enum: [RegistrationStatus.APPROVED, RegistrationStatus.REJECTED],
    enumName: 'ReviewRegistrationStatus',
  })
  @IsEnum([RegistrationStatus.APPROVED, RegistrationStatus.REJECTED] as const)
  status: RegistrationStatus.APPROVED | RegistrationStatus.REJECTED;

  @ApiProperty({
    example: '35202-1234567-1',
    description:
      'Must match the registration CNIC — confirms the correct request before status update',
  })
  @IsString()
  @Matches(/^\d{5}-\d{7}-\d$/, {
    message: 'cnic_national_id must match #####-#######-#',
  })
  cnic_national_id: string;

  @ApiPropertyOptional({
    description: 'Required when status is REJECTED',
  })
  @ValidateIf(
    (o: ReviewRegistrationDto) => o.status === RegistrationStatus.REJECTED,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejection_reason?: string;
}

export class DashboardAnnouncementItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: AnnouncementCategory })
  category: AnnouncementCategory;

  @ApiPropertyOptional({ nullable: true })
  image_url: string | null;

  @ApiProperty()
  is_published: boolean;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  published_at: Date | null;
}

export class AdminDashboardResponseDto {
  @ApiProperty({ description: 'Total number of alumni' })
  alumni_count: number;

  @ApiProperty({ description: 'Number of pending registration requests' })
  pending_registrations_count: number;

  @ApiProperty({
    description:
      'Number of rejected registration requests (all rows; duplicates included)',
  })
  rejected_requests_count: number;

  @ApiProperty({
    description: 'Number of contact requests awaiting admin review',
  })
  pending_contact_requests_count: number;

  @ApiProperty({ description: 'Total number of published (non-draft) events' })
  published_events_count: number;

  @ApiProperty({
    description: 'Events with event_date on or after today',
  })
  active_events_count: number;

  @ApiProperty({
    description: 'Events with event_date before today',
  })
  completed_events_count: number;

  @ApiProperty({
    type: [DashboardAnnouncementItemDto],
    description: 'Latest published announcements (top 5)',
  })
  latest_announcements: DashboardAnnouncementItemDto[];
}
