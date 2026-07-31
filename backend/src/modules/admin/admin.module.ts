import { Module } from '@nestjs/common';
import { ALUMNI_CARD_GENERATOR } from '../../common/constants/tokens';
import { AuthModule } from '../auth/auth.module';
import { AlumniModule } from '../alumni/alumni.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AdminAlumniCardController } from './controllers/admin-alumni-card.controller';
import { AdminPortalController } from './controllers/admin-portal.controller';
import { AlumniCardService } from './services/alumni-card.service';
import { ApprovalService } from './services/approval.service';
import { RegistrationReviewService } from './services/registration-review.service';
import { RejectionService } from './services/rejection.service';
import { QrAlumniCardGenerator } from './services/qr-alumni-card.generator';

@Module({
  imports: [AlumniModule, AuthModule, IntegrationsModule],
  controllers: [AdminPortalController, AdminAlumniCardController],
  providers: [
    RegistrationReviewService,
    ApprovalService,
    RejectionService,
    AlumniCardService,
    {
      provide: ALUMNI_CARD_GENERATOR,
      useClass: QrAlumniCardGenerator,
    },
  ],
})
export class AdminModule {}
