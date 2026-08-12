import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class GenerateAlumniCardDto {
  @ApiPropertyOptional({
    description:
      'Optional media_id (REGISTRATION_PHOTO or ALUMNI_PHOTO). Falls back to alumni photo.',
  })
  @IsOptional()
  @IsUUID()
  media_id?: string;

  @ApiPropertyOptional({
    description: 'Optional note stored with generation metadata',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
