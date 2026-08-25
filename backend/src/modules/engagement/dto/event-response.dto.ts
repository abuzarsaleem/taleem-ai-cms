import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventLifecycleStatus,
  EventType,
  RsvpStatus,
} from '../../../common/enums';
import { EventTargetCriteriaDto } from './event.dto';

export class EventRsvpCountsDto {
  @ApiProperty()
  going: number;

  @ApiProperty()
  not_going: number;

  @ApiProperty()
  maybe: number;

  @ApiProperty()
  total: number;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: EventType })
  event_type: EventType;

  @ApiProperty({ example: '2026-09-15' })
  event_date: string;

  @ApiProperty({ example: '18:00:00' })
  start_time: string;

  @ApiPropertyOptional({ nullable: true, example: '21:00:00' })
  end_time: string | null;

  @ApiProperty()
  venue: string;

  @ApiPropertyOptional({ nullable: true })
  guest_speaker: string | null;

  @ApiPropertyOptional({ nullable: true })
  image_url: string | null;

  @ApiProperty()
  is_draft: boolean;

  @ApiProperty({ enum: EventLifecycleStatus })
  status: EventLifecycleStatus;

  @ApiPropertyOptional({ nullable: true })
  status_reason: string | null;

  @ApiPropertyOptional({ type: EventTargetCriteriaDto, nullable: true })
  target_criteria: EventTargetCriteriaDto | null;

  @ApiProperty()
  created_by: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class EventDetailResponseDto extends EventResponseDto {
  @ApiPropertyOptional({ enum: RsvpStatus, nullable: true })
  my_rsvp_status: RsvpStatus | null;

  @ApiProperty({ type: EventRsvpCountsDto })
  rsvp_counts: EventRsvpCountsDto;
}

export class RsvpResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  event_id: string;

  @ApiProperty()
  alumni_id: string;

  @ApiProperty({ enum: RsvpStatus, enumName: 'RsvpStatus' })
  status: RsvpStatus;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class AdminRsvpListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  event_id: string;

  @ApiProperty()
  alumni_id: string;

  @ApiPropertyOptional({ nullable: true })
  full_name: string | null;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiProperty({ enum: RsvpStatus, enumName: 'RsvpStatus' })
  status: RsvpStatus;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class DeletedIdResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
