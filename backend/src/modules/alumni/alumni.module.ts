import { Module, forwardRef } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  PHOTO_UPLOAD_REPOSITORY,
  REGISTRATION_REQUEST_REPOSITORY,
  USER_REPOSITORY,
  VERIFICATION_TOKEN_REPOSITORY,
} from '../../common/constants/tokens';
import { AuthModule } from '../auth/auth.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AlumniPortalController } from './controllers/alumni-portal.controller';
import { InMemoryAlumniRepository } from './repositories/in-memory-alumni.repository';
import { InMemoryRegistrationRequestRepository } from './repositories/in-memory-registration-request.repository';
import {
  InMemoryPhotoUploadRepository,
  InMemoryVerificationTokenRepository,
} from './repositories/in-memory-supporting.repository';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { ActivationService } from './services/activation.service';
import { PhotoUploadService } from './services/photo-upload.service';
import { ProfileService } from './services/profile.service';
import { RegistrationService } from './services/registration.service';

@Module({
  imports: [IntegrationsModule, forwardRef(() => AuthModule)],
  controllers: [AlumniPortalController],
  providers: [
    RegistrationService,
    ActivationService,
    ProfileService,
    PhotoUploadService,
    {
      provide: REGISTRATION_REQUEST_REPOSITORY,
      useClass: InMemoryRegistrationRequestRepository,
    },
    {
      provide: ALUMNI_REPOSITORY,
      useClass: InMemoryAlumniRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
    {
      provide: VERIFICATION_TOKEN_REPOSITORY,
      useClass: InMemoryVerificationTokenRepository,
    },
    {
      provide: PHOTO_UPLOAD_REPOSITORY,
      useClass: InMemoryPhotoUploadRepository,
    },
  ],
  exports: [
    RegistrationService,
    ActivationService,
    ProfileService,
    PhotoUploadService,
    REGISTRATION_REQUEST_REPOSITORY,
    ALUMNI_REPOSITORY,
    USER_REPOSITORY,
    VERIFICATION_TOKEN_REPOSITORY,
    PHOTO_UPLOAD_REPOSITORY,
  ],
})
export class AlumniModule {}
