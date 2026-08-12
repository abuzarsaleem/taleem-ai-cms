import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AlumniStatus,
  RegistrationStatus,
} from '../../../common/enums';

export class RegistrationListItemDto {
  @ApiProperty()
  registration_id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phone_number: string | null;

  @ApiProperty({ enum: RegistrationStatus })
  status: RegistrationStatus;

  @ApiProperty()
  submitted_at: Date;

  @ApiProperty()
  degree_program_id: string;

  @ApiProperty()
  registration_roll_number: string;

  @ApiProperty()
  graduation_year: string;

  @ApiProperty()
  cnic_national_id: string;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;
}

export class RegistrationAlumniSummaryDto {
  @ApiProperty()
  alumni_id: string;

  @ApiProperty({ enum: AlumniStatus })
  status: AlumniStatus;

  @ApiPropertyOptional({ nullable: true })
  user_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  qr_code: string | null;
}

export class RegistrationDetailResponseDto extends RegistrationListItemDto {
  @ApiPropertyOptional({ nullable: true })
  whatsapp_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejection_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_by: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_at: Date | null;

  @ApiPropertyOptional({ type: RegistrationAlumniSummaryDto, nullable: true })
  alumni: RegistrationAlumniSummaryDto | null;
}

export class RegistrationApproveResponseDto {
  @ApiProperty()
  registration_id: string;

  @ApiProperty()
  alumni_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({ enum: [RegistrationStatus.APPROVED] })
  status: RegistrationStatus.APPROVED;

  @ApiPropertyOptional({ nullable: true })
  qr_code: string | null;

  @ApiProperty()
  qr_failed: boolean;

  @ApiProperty()
  notification_failed: boolean;
}

export class RegistrationRejectResponseDto {
  @ApiProperty()
  registration_id: string;

  @ApiProperty({ enum: [RegistrationStatus.REJECTED] })
  status: RegistrationStatus.REJECTED;

  @ApiProperty()
  rejection_reason: string;

  @ApiProperty()
  notification_failed: boolean;
}

export class AnalyticsBucketDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  count: number;
}

export class AdminAlumniDegreeProgramDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  degree_id: string;

  @ApiProperty()
  degree: string;

  @ApiProperty()
  degree_code: string;

  @ApiProperty()
  program_id: string;

  @ApiProperty()
  program: string;

  @ApiPropertyOptional({ nullable: true })
  department: string | null;

  @ApiPropertyOptional({ nullable: true })
  campus: string | null;
}

export class AdminAlumniProfessionalSummaryDto {
  @ApiPropertyOptional({ nullable: true })
  current_company: string | null;

  @ApiPropertyOptional({ nullable: true })
  job_title: string | null;

  @ApiPropertyOptional({ nullable: true })
  role: string | null;
}

export class AdminAlumniListItemDto {
  @ApiProperty()
  alumni_id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phone_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  city: string | null;

  @ApiPropertyOptional({ nullable: true })
  country: string | null;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  graduation_year: string | null;

  @ApiPropertyOptional({ nullable: true })
  registration_roll_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  degree_program_id: string | null;

  @ApiPropertyOptional({ type: AdminAlumniDegreeProgramDto, nullable: true })
  degree_program: AdminAlumniDegreeProgramDto | null;

  @ApiPropertyOptional({
    type: AdminAlumniProfessionalSummaryDto,
    nullable: true,
  })
  professional: AdminAlumniProfessionalSummaryDto | null;
}

export class AdminAlumniAnalyticsBlockDto {
  @ApiProperty({ type: [AnalyticsBucketDto] })
  graduation_year: AnalyticsBucketDto[];

  @ApiProperty({ type: [AnalyticsBucketDto] })
  degree: AnalyticsBucketDto[];

  @ApiProperty({ type: [AnalyticsBucketDto] })
  degree_program: AnalyticsBucketDto[];

  @ApiProperty({ type: [AnalyticsBucketDto] })
  department: AnalyticsBucketDto[];
}

export class AdminAlumniGeographyBlockDto {
  @ApiProperty({ type: [AnalyticsBucketDto] })
  cities: AnalyticsBucketDto[];

  @ApiProperty({ type: [AnalyticsBucketDto] })
  countries: AnalyticsBucketDto[];
}

export class AdminAlumniListAnalyticsDto {
  @ApiProperty({ type: AdminAlumniAnalyticsBlockDto })
  distribution: AdminAlumniAnalyticsBlockDto;

  @ApiProperty({ type: AdminAlumniGeographyBlockDto })
  geography: AdminAlumniGeographyBlockDto;
}

export class AdminAlumniListResponseDto {
  @ApiProperty({ type: [AdminAlumniListItemDto] })
  items: AdminAlumniListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  page_size: number;

  @ApiProperty({ type: AdminAlumniListAnalyticsDto })
  analytics: AdminAlumniListAnalyticsDto;
}
