import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sslEnabled = config.get<string>('DB_SSL') === 'true';
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get<string>('DB_PORT', '5432')),
          username: config.get<string>('DB_USER', 'postgres'),
          password: config.get<string>('DB_PASSWORD', ''),
          database: config.get<string>('DB_NAME', 'postgres'),
          entities: databaseEntities,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: false,
          logging: config.get<string>('DB_LOGGING') === 'true',
          autoLoadEntities: false,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
