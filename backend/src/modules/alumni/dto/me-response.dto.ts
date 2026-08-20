import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlumniStatus } from '../../../common/enums';

export class ProfileAcademicItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  degree_program_id: string;

  @ApiProperty()
  registration_roll_number: string;

  @ApiPropertyOptional({ nullable: true })
  registration_year: string | null;

  @ApiProperty()
  graduation_year: string;

  @ApiPropertyOptional({ nullable: true })
  cgpa: number | null;

  @ApiProperty()
  is_verification: boolean;
}

export class ProfileProfessionalItemDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  current_company: string | null;

  @ApiPropertyOptional({ nullable: true })
  job_title: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Job role' })
  role: string | null;

  @ApiProperty()
  start_date: Date;

  @ApiPropertyOptional({ nullable: true })
  end_date: Date | null;
}

export class AlumniProfileResponseDto {
  @ApiProperty()
  alumni_id: string;

  @ApiProperty({
    example: 'ALM-2026-0003847',
    description: 'Public lifelong alumni code (same as registration reference)',
  })
  public_alumni_code: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: AlumniStatus })
  status: AlumniStatus;

  @ApiPropertyOptional({ nullable: true })
  phone_number: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp_number: string | null;

  @ApiProperty()
  cnic_national_id: string;

  @ApiPropertyOptional({ nullable: true })
  address: string | null;

  @ApiPropertyOptional({ nullable: true })
  secondry_address: string | null;

  @ApiPropertyOptional({ nullable: true })
  city: string | null;

  @ApiPropertyOptional({ nullable: true })
  country: string | null;

  @ApiPropertyOptional({ nullable: true })
  gender: string | null;

  @ApiPropertyOptional({ nullable: true })
  date_of_birth: Date | null;

  @ApiPropertyOptional({ nullable: true })
  linkedin_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  qr_code: string | null;

  @ApiProperty({ type: [ProfileAcademicItemDto] })
  academic: ProfileAcademicItemDto[];

  @ApiProperty({ type: [ProfileProfessionalItemDto] })
  professional: ProfileProfessionalItemDto[];
}

export class IdResponseDto {
  @ApiProperty()
  id: string;
}

export class DeletedIdResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
