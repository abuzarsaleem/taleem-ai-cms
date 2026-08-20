import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlumniVerifyResponseDto {
  @ApiProperty({ example: true })
  is_valid!: boolean;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  status?: string | null;

  @ApiPropertyOptional({ example: 'Invalid or inactive alumni card.' })
  message?: string | null;

  @ApiPropertyOptional({ example: 'Ali Khan' })
  full_name?: string | null;

  @ApiPropertyOptional({ example: 'ALM-2026-0000014' })
  public_alumni_code?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  photo_url?: string | null;

  @ApiPropertyOptional({ example: 'BS Computer Science' })
  degree_label?: string | null;

  @ApiPropertyOptional({ example: '2024' })
  graduation_year?: string | null;

  @ApiPropertyOptional({ example: '21-CS-001' })
  registration_roll_number?: string | null;

  @ApiPropertyOptional({ example: '2026-08-17T06:47:00.000Z' })
  verified_at?: string | null;
}
