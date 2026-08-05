import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContactRequestStatus } from '../../../common/enums';

export class DirectoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  graduation_year?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  degree_program_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;
}

export class CreateContactRequestDto {
  @ApiProperty()
  @IsUUID()
  target_alumni_id: string;

  @ApiProperty({ example: 'Looking to connect for a job opening' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  request_reason: string;
}

export class RespondContactRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejection_reason?: string;
}

export class AdminReviewContactRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejection_reason?: string;
}

export enum AdminContactReviewAction {
  FORWARD = 'FORWARD',
  REJECT = 'REJECT',
}

export enum AlumniContactRespondAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class AdminContactRequestQueryDto {
  @ApiPropertyOptional({ enum: ContactRequestStatus })
  @IsOptional()
  @IsEnum(ContactRequestStatus)
  status?: ContactRequestStatus;
}
