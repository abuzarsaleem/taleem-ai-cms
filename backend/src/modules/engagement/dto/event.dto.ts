import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, RsvpStatus } from '../../../common/enums';

export class EventTargetCriteriaDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['22222222-2222-4222-8222-222222222201'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  campus_ids?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['55555555-5555-4555-8555-555555555501'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  degree_program_ids?: string[];

  @ApiPropertyOptional({ type: [Number], example: [2018, 2019, 2020] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  graduation_years?: number[];

  @ApiPropertyOptional({ type: [String], example: ['Islamabad', 'Lahore'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  cities?: string[];
}

export class CreateEventDto {
  @ApiProperty({ example: 'Annual Alumni Reunion 2026' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EventType, default: EventType.OTHER })
  @IsEnum(EventType)
  event_type: EventType = EventType.OTHER;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  event_date: string;

  @ApiProperty({ example: '18:00:00', description: 'HH:mm or HH:mm:ss' })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'start_time must be HH:mm or HH:mm:ss',
  })
  start_time: string;

  @ApiPropertyOptional({ example: '21:00:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'end_time must be HH:mm or HH:mm:ss',
  })
  end_time?: string;

  @ApiProperty({ example: 'Main Campus Auditorium' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  venue: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guest_speaker?: string;

  @ApiPropertyOptional({ type: EventTargetCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventTargetCriteriaDto)
  target_criteria?: EventTargetCriteriaDto | null;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class RsvpEventDto {
  @ApiProperty({ enum: RsvpStatus })
  @IsEnum(RsvpStatus)
  status: RsvpStatus;
}

export enum EventListScope {
  UPCOMING = 'upcoming',
  PAST = 'past',
  ALL = 'all',
}

export class EventListQueryDto {
  @ApiPropertyOptional({ enum: EventListScope })
  @IsOptional()
  @IsEnum(EventListScope)
  scope?: EventListScope;

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
}
