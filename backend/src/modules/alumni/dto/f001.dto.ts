import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
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

export class UploadPhotoResponseDto {
  @ApiProperty()
  upload_id: string;

  @ApiProperty()
  public_url: string;

  @ApiProperty()
  expires_at: Date;
}

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  full_name: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  campus: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  degree: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  roll_number: string;

  @ApiProperty()
  @IsInt()
  @Min(1950)
  @Max(2100)
  graduation_year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  cgpa?: number;

  @ApiPropertyOptional({
    description: 'Photo upload_id from POST /upload-photo',
  })
  @IsOptional()
  @IsUUID()
  upload_id?: string;
}

export class ActivateDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;
}

export class ResendActivationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_of_birth?: string;

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
  @IsInt()
  @Min(0)
  years_of_experience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  upload_id?: string;
}
