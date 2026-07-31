import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '../../../common/enums';

export class RegistrationRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ enum: RegistrationStatus })
  status: RegistrationStatus;

  @ApiProperty()
  submittedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  reviewedBy: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;

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
