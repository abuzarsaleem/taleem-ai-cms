import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AlumniAcademicInformationEntity,
  AnnouncementEntity,
  DegreeProgramEntity,
  EventEntity,
  EventRsvpEntity,
} from '../../database/entities';
import { AlumniModule } from '../alumni/alumni.module';
import { AuthModule } from '../auth/auth.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AdminAnnouncementsController } from './controllers/admin-announcements.controller';
import { AdminEventsController } from './controllers/admin-events.controller';
import { AnnouncementsController } from './controllers/announcements.controller';
import { EventsController } from './controllers/events.controller';
import { AnnouncementService } from './services/announcement.service';
import { EventService } from './services/event.service';

const dbEnabled = process.env.DB_ENABLED !== 'false';

@Module({
  imports: [
    AlumniModule,
    AuthModule,
    IntegrationsModule,
    ...(dbEnabled
      ? [
          TypeOrmModule.forFeature([
            EventEntity,
            EventRsvpEntity,
            AnnouncementEntity,
            AlumniAcademicInformationEntity,
            DegreeProgramEntity,
          ]),
        ]
      : []),
  ],
  controllers: dbEnabled
    ? [
        EventsController,
        AdminEventsController,
        AnnouncementsController,
        AdminAnnouncementsController,
      ]
    : [],
  providers: dbEnabled ? [EventService, AnnouncementService] : [],
})
export class EngagementModule {}
