import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProfessionalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  current_company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  job_title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  years_of_experience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin_url?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsString()
  @MinLength(8)
  @MaxLength(10)
  start_date: string;

  @ApiPropertyOptional({
    description:
      'Required when a current job (end_date null) already exists; closes that job',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(10)
  previous_end_date?: string;
}

export class UpdateProfessionalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  current_company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  job_title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  years_of_experience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin_url?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(10)
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(10)
  end_date?: string | null;
}

export class CreateAcademicDto {
  @ApiProperty({
    description: 'degree_programs.id for campus+degree+program combo',
  })
  @IsUUID()
  degree_program_id: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  registration_roll_number: string;

  @ApiProperty({ example: '2021' })
  @IsString()
  @MaxLength(20)
  graduation_year: string;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  cgpa?: number;
}

export class UpdateAcademicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  degree_program_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  registration_roll_number?: string;

  @ApiPropertyOptional({ example: '2021' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  graduation_year?: string;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  cgpa?: number | null;
}
