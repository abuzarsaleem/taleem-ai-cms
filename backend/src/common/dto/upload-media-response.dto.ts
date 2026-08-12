import { ApiProperty } from '@nestjs/swagger';

export class UploadMediaResponseDto {
  @ApiProperty({ description: 'portal_media.id — pass as media_id on create/update' })
  media_id: string;

  @ApiProperty({ description: 'Resolved URL for preview' })
  public_url: string;
}
