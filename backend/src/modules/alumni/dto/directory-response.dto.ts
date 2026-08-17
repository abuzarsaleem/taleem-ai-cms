import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactRequestStatus } from '../../../common/enums';

export class DirectoryFilterOptionsDto {
  @ApiProperty({ type: [String], example: ['Lahore', 'Karachi'] })
  cities!: string[];

  @ApiProperty({ type: [String], example: ['Pakistan', 'UAE'] })
  countries!: string[];

  @ApiProperty({ type: [String], example: ['2024', '2023'] })
  graduation_years!: string[];
}

export class DirectoryAcademicSummaryDto {
  @ApiProperty()
  degree_program_id: string;

  @ApiProperty()
  graduation_year: string;
}

export class DirectoryProfessionalSummaryDto {
  @ApiPropertyOptional({ nullable: true })
  current_company: string | null;

  @ApiPropertyOptional({ nullable: true })
  job_title: string | null;

  @ApiPropertyOptional({ nullable: true })
  role: string | null;
}

export class DirectoryAlumniCardDto {
  @ApiProperty()
  alumni_id: string;

  @ApiProperty()
  full_name: string;

  @ApiPropertyOptional({ nullable: true })
  city: string | null;

  @ApiPropertyOptional({ nullable: true })
  country: string | null;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiProperty({ type: [DirectoryAcademicSummaryDto] })
  academic: DirectoryAcademicSummaryDto[];

  @ApiProperty({ type: [DirectoryProfessionalSummaryDto] })
  professional: DirectoryProfessionalSummaryDto[];

  @ApiProperty()
  is_contact_revealed: boolean;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phone_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  address: string | null;

  @ApiPropertyOptional({ nullable: true })
  secondry_address: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedin_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  primary_graduation_year?: string | null;

  @ApiPropertyOptional({ nullable: true })
  primary_role?: string | null;
}

export class ContactRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requester_alumni_id: string;

  @ApiProperty()
  target_alumni_id: string;

  @ApiProperty()
  request_reason: string;

  @ApiProperty({ enum: ContactRequestStatus })
  status: ContactRequestStatus;

  @ApiPropertyOptional({ nullable: true })
  admin_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejection_reason: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
