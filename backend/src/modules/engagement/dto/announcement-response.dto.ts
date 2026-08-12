import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementCategory } from '../../../common/enums';

export class FeaturedAlumniResponseDto {
  @ApiProperty()
  alumni_id: string;

  @ApiProperty()
  full_name: string;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  degree: string | null;

  @ApiPropertyOptional({ nullable: true })
  graduation_year: string | null;
}

export class AnnouncementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: AnnouncementCategory })
  category: AnnouncementCategory;

  @ApiPropertyOptional({ nullable: true })
  featured_alumni_id: string | null;

  @ApiPropertyOptional({ type: FeaturedAlumniResponseDto, nullable: true })
  featured_alumni: FeaturedAlumniResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  image_url: string | null;

  @ApiProperty()
  is_published: boolean;

  @ApiPropertyOptional({ nullable: true })
  published_at: Date | null;

  @ApiProperty()
  created_by: string;
}

export class DeletedAnnouncementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
