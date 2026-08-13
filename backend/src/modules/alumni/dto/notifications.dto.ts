import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class NotificationsQueryDto {
  @ApiPropertyOptional({
    description:
      'ISO timestamp. Counts items created/published after this time. Defaults to 7 days ago.',
    example: '2026-08-13T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;
}

export class NotificationItemDto {
  @ApiProperty({ enum: ['alumni', 'event', 'announcement'] })
  type: 'alumni' | 'event' | 'announcement';

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  occurred_at: Date;
}

export class NotificationsSummaryDto {
  @ApiProperty({ description: 'alumni + events + announcements since cutoff' })
  unread_count: number;

  @ApiProperty()
  alumni: number;

  @ApiProperty()
  events: number;

  @ApiProperty()
  announcements: number;

  @ApiProperty()
  since: Date;

  @ApiProperty({ type: [NotificationItemDto] })
  items: NotificationItemDto[];
}
