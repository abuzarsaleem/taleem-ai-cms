import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class NotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'Deprecated — unread state is stored in the database',
  })
  @IsOptional()
  since?: string;
}

export class NotificationItemDto {
  @ApiProperty({ enum: ['alumni', 'event', 'announcement'] })
  type: 'alumni' | 'event' | 'announcement';

  @ApiProperty({ description: 'Referenced alumni/event/announcement id' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  occurred_at: Date;

  @ApiPropertyOptional()
  is_read?: boolean;

  @ApiPropertyOptional({ description: 'Row id in alumni_notifications' })
  notification_id?: string;
}

export class NotificationsSummaryDto {
  @ApiProperty()
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

export class MarkNotificationsReadDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Notification row ids. Omit to mark all as read.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  notification_ids?: string[];
}
