import 'dotenv/config';
import { Module } from '@nestjs/common';
import {
  NOTIFICATION_SENDER,
  PHOTO_STORAGE,
} from '../../common/constants/tokens';
import { BrevoNotificationSender } from './notifications/brevo-notification.sender';
import { LoggingNotificationSender } from './notifications/logging-notification.sender';
import { ResendNotificationSender } from './notifications/resend-notification.sender';
import { LocalObjectStorage } from './storage/local-object.storage';
import { S3MinioObjectStorage } from './storage/s3-minio-object.storage';

const storageDriver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
const notificationDriver = (
  process.env.NOTIFICATION_DRIVER ?? 'log'
).toLowerCase(); // log | resend | brevo

const notificationSender =
  notificationDriver === 'brevo'
    ? BrevoNotificationSender
    : notificationDriver === 'resend'
      ? ResendNotificationSender
      : LoggingNotificationSender;

@Module({
  providers: [
    {
      provide: NOTIFICATION_SENDER,
      useClass: notificationSender,
    },
    {
      provide: PHOTO_STORAGE,
      useClass:
        ['s3', 'minio', 'b2', 'backblaze'].includes(storageDriver)
          ? S3MinioObjectStorage
          : LocalObjectStorage,
    },
  ],
  exports: [NOTIFICATION_SENDER, PHOTO_STORAGE],
})
export class IntegrationsModule {}
