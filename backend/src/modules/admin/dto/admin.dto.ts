import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RegistrationStatus } from '../../../common/enums';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@taleem.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class ReviewRegistrationDto {
  @ApiProperty({
    enum: [RegistrationStatus.APPROVED, RegistrationStatus.REJECTED],
    enumName: 'ReviewRegistrationStatus',
  })
  @IsEnum([RegistrationStatus.APPROVED, RegistrationStatus.REJECTED] as const)
  status: RegistrationStatus.APPROVED | RegistrationStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Required when status is REJECTED',
  })
  @ValidateIf(
    (o: ReviewRegistrationDto) => o.status === RegistrationStatus.REJECTED,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejection_reason?: string;
}

export class GenerateAlumniCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;
}
