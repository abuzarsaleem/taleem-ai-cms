import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalMediaEntity } from '../../database/entities';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PortalMediaService } from './portal-media.service';

const dbEnabled = process.env.DB_ENABLED !== 'false';

@Module({
  imports: [
    IntegrationsModule,
    ...(dbEnabled ? [TypeOrmModule.forFeature([PortalMediaEntity])] : []),
  ],
  providers: dbEnabled ? [PortalMediaService] : [],
  exports: dbEnabled ? [PortalMediaService] : [],
})
export class MediaModule {}
