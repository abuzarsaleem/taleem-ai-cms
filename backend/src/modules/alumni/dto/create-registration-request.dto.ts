import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRegistrationRequestDto {
  @ApiProperty({ example: 'Ali Khan', maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ example: 'ali.khan@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '+923001234567', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({ example: 'Main Campus', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  campus: string;

  @ApiProperty({ example: 'BS Computer Science', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  degree: string;

  @ApiProperty({ example: 'CS-2019-042', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  rollNumber: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(1950)
  @Max(2100)
  graduationYear: number;

  @ApiPropertyOptional({ example: 3.45 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  cgpa?: number;
}
