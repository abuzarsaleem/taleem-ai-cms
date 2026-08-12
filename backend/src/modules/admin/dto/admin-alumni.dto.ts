import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum AdminOutreachChannel {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  BOTH = 'both',
}

export class AdminAlumniQueryDto {
  @ApiPropertyOptional({ description: 'Search by full name, email, phone or WhatsApp' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  graduation_year?: string;

  @ApiPropertyOptional({
    description:
      'Filter by degree level (e.g. BS). Use GET /catalog/degrees for IDs. Matches all programs under that degree.',
  })
  @IsOptional()
  @IsUUID()
  degree_id?: string;

  @ApiPropertyOptional({
    description:
      'Filter by program (e.g. Computer Science). Use GET /catalog/programs for IDs.',
  })
  @IsOptional()
  @IsUUID()
  program_id?: string;

  @ApiPropertyOptional({
    description:
      'Exact degree+program(+campus) offering. Use GET /catalog/degree-programs for IDs.',
  })
  @IsOptional()
  @IsUUID()
  degree_program_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by department name (partial match on programs.department)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

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

  @ApiPropertyOptional({ description: 'Filter by professional job role' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  role?: string;

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

export class AdminOutreachExportQueryDto extends AdminAlumniQueryDto {
  @ApiPropertyOptional({ enum: AdminOutreachChannel, default: AdminOutreachChannel.BOTH })
  @IsOptional()
  @IsEnum(AdminOutreachChannel)
  channel?: AdminOutreachChannel = AdminOutreachChannel.BOTH;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  names_only?: boolean = false;
}
