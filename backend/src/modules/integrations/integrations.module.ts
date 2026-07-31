import 'dotenv/config';
import { Module } from '@nestjs/common';
import {
  NOTIFICATION_SENDER,
  PHOTO_STORAGE,
} from '../../common/constants/tokens';
import { LoggingNotificationSender } from './notifications/logging-notification.sender';
import { LocalObjectStorage } from './storage/local-object.storage';
import { S3MinioObjectStorage } from './storage/s3-minio-object.storage';

const storageDriver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();

@Module({
  providers: [
    { provide: NOTIFICATION_SENDER, useClass: LoggingNotificationSender },
    {
      provide: PHOTO_STORAGE,
      useClass:
        storageDriver === 's3' || storageDriver === 'minio'
          ? S3MinioObjectStorage
          : LocalObjectStorage,
    },
  ],
  exports: [NOTIFICATION_SENDER, PHOTO_STORAGE],
})
export class IntegrationsModule {}
