import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { RegistrationStatus } from '../../../common/enums';

export class ReviewRegistrationDto {
  @ApiProperty({
    enum: [RegistrationStatus.APPROVED, RegistrationStatus.REJECTED],
  })
  @IsIn([RegistrationStatus.APPROVED, RegistrationStatus.REJECTED])
  status: RegistrationStatus.APPROVED | RegistrationStatus.REJECTED;

  @ApiProperty({
    description: 'Admin user id performing the review',
    example: '00000000-0000-4000-8000-000000000001',
  })
  @IsUUID()
  reviewedBy: string;

  @ApiPropertyOptional({
    description: 'Required when status is REJECTED',
  })
  @ValidateIf((dto: ReviewRegistrationDto) => dto.status === RegistrationStatus.REJECTED)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason?: string;
}

export class ListRegistrationQueryDto {
  @ApiPropertyOptional({ enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
