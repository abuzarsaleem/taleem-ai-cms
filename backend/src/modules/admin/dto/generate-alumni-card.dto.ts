import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class GenerateAlumniCardDto {
  @ApiPropertyOptional({
    description: 'Optional photo URL. Falls back to existing photo.',
    example: 'https://cdn.example.com/photos/alumni-42.jpg',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional note stored with generation metadata',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
