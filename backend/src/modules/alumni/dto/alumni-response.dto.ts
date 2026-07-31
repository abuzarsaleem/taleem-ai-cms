import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlumniStatus } from '../../../common/enums';

export class AlumniAcademicResponseDto {
  @ApiProperty()
  campus: string;

  @ApiProperty()
  degree: string;

  @ApiProperty()
  rollNumber: string;

  @ApiProperty()
  graduationYear: number;

  @ApiPropertyOptional({ nullable: true })
  cgpa: number | null;
}

export class AlumniCardResponseDto {
  @ApiProperty()
  alumniId: string;

  @ApiProperty()
  registrationRef: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: AlumniStatus })
  status: AlumniStatus;

  @ApiPropertyOptional({ nullable: true })
  alumniPhoto: string | null;

  @ApiPropertyOptional({ nullable: true })
  alumniQrCode: string | null;

  @ApiProperty({ type: AlumniAcademicResponseDto })
  academic: AlumniAcademicResponseDto;

  @ApiProperty()
  generatedAt: Date;
}

export class AlumniProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  registrationRef: string;

  @ApiProperty({ enum: AlumniStatus })
  status: AlumniStatus;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  alumniPhoto: string | null;

  @ApiPropertyOptional({ nullable: true })
  alumniQrCode: string | null;

  @ApiProperty({ type: AlumniAcademicResponseDto })
  academic: AlumniAcademicResponseDto;
}
