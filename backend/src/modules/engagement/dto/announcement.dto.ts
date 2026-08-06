import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AnnouncementCategory } from '../../../common/enums';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Welcome new alumni board' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  content: string;

  @ApiProperty({
    enum: AnnouncementCategory,
    default: AnnouncementCategory.ANNOUNCEMENT,
  })
  @IsEnum(AnnouncementCategory)
  category: AnnouncementCategory = AnnouncementCategory.ANNOUNCEMENT;

  @ApiPropertyOptional({
    description: 'Required for ALUMNI_SPOTLIGHT when featuring someone',
  })
  @IsOptional()
  @IsUUID()
  featured_alumni_id?: string;

  @ApiPropertyOptional({
    description:
      'Durable image URL from POST /api/v1/admin/announcements/upload-image',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_published?: boolean = true;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class UploadAnnouncementImageResponseDto {
  @ApiProperty({
    description: 'Durable URL to store in create/update image_url',
  })
  image_url: string;

  @ApiProperty({ description: 'Object storage key' })
  storage_key: string;
}

export class AnnouncementListQueryDto {
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

  @ApiPropertyOptional({
    description: 'Admin only: include unpublished drafts',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  include_drafts?: boolean = false;
}
