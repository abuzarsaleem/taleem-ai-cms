import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlumniDashboardStatsDto {
  @ApiProperty()
  total_alumni: number;

  @ApiProperty()
  new_this_month: number;

  @ApiProperty()
  upcoming_events: number;

  @ApiProperty({
    description: 'Percentage of alumni with a generated QR alumni card',
  })
  verified_profiles_percent: number;
}

export class AlumniDashboardAlumniCardDto {
  @ApiProperty()
  alumni_id: string;

  @ApiProperty()
  full_name: string;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  degree_label: string | null;

  @ApiPropertyOptional({ nullable: true })
  graduation_year: string | null;

  @ApiPropertyOptional({ nullable: true })
  job_title: string | null;
}

export class AlumniDashboardEventCardDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  venue: string;

  @ApiProperty({ example: '2026-09-14' })
  event_date: string;

  @ApiProperty({ example: '18:00:00' })
  start_time: string;

  @ApiPropertyOptional({ nullable: true })
  my_rsvp_status: string | null;

  @ApiProperty()
  is_online: boolean;
}

export class AlumniDashboardAnnouncementCardDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional({ nullable: true })
  published_at: Date | null;
}

export class AlumniDashboardResponseDto {
  @ApiProperty()
  full_name: string;

  @ApiPropertyOptional({ nullable: true })
  photo_url: string | null;

  @ApiProperty({ type: AlumniDashboardStatsDto })
  stats: AlumniDashboardStatsDto;

  @ApiProperty({ type: [AlumniDashboardAlumniCardDto] })
  newly_registered: AlumniDashboardAlumniCardDto[];

  @ApiProperty({ type: [AlumniDashboardEventCardDto] })
  upcoming_events: AlumniDashboardEventCardDto[];

  @ApiProperty({ type: [AlumniDashboardAnnouncementCardDto] })
  announcements: AlumniDashboardAnnouncementCardDto[];
}
