import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { AlumniModule } from './modules/alumni/alumni.module';
import { AuthModule } from './modules/auth/auth.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

const dbEnabled = process.env.DB_ENABLED !== 'false';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ...(dbEnabled ? [DatabaseModule] : []),
    IntegrationsModule,
    AuthModule,
    AlumniModule,
    AdminModule,
  ],
})
export class AppModule {}
