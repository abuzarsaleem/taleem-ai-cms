import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALUMNI_CARD_GENERATOR } from '../../common/constants/tokens';
import { AlumniEntity } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { AlumniModule } from '../alumni/alumni.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AdminAlumniAnalyticsController } from './controllers/admin-alumni-analytics.controller';
import { AdminAlumniCardController } from './controllers/admin-alumni-card.controller';
import { AdminContactRequestController } from './controllers/admin-contact-request.controller';
import { AdminPortalController } from './controllers/admin-portal.controller';
import { AdminAlumniAnalyticsService } from './services/admin-alumni-analytics.service';
import { AlumniCardService } from './services/alumni-card.service';
import { ApprovalService } from './services/approval.service';
import { RegistrationReviewService } from './services/registration-review.service';
import { RejectionService } from './services/rejection.service';
import { QrAlumniCardGenerator } from './services/qr-alumni-card.generator';

const dbEnabled = process.env.DB_ENABLED !== 'false';

@Module({
  imports: [
    AlumniModule,
    AuthModule,
    IntegrationsModule,
    ...(dbEnabled
      ? [
          TypeOrmModule.forFeature([AlumniEntity]),
        ]
      : []),
  ],
  controllers: [
    AdminPortalController,
    AdminAlumniCardController,
    AdminContactRequestController,
    ...(dbEnabled ? [AdminAlumniAnalyticsController] : []),
  ],
  providers: [
    RegistrationReviewService,
    ApprovalService,
    RejectionService,
    AlumniCardService,
    ...(dbEnabled ? [AdminAlumniAnalyticsService] : []),
    {
      provide: ALUMNI_CARD_GENERATOR,
      useClass: QrAlumniCardGenerator,
    },
  ],
})
export class AdminModule {}
