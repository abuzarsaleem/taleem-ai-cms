import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationSender,
  NotificationPayload,
} from '../../../common/interfaces/notification-sender.interface';

/**
 * Stub notification adapter (Email/WhatsApp behind same interface later).
 * Logs only — never logs secrets/tokens in production paths beyond URL placeholders.
 */
@Injectable()
export class LoggingNotificationSender implements INotificationSender {
  private readonly logger = new Logger(LoggingNotificationSender.name);

  async send(payload: NotificationPayload): Promise<void> {
    const safeVariables = { ...payload.variables };
    if (safeVariables.activationToken) {
      safeVariables.activationToken = '[redacted]';
    }
    if (safeVariables.activationLink) {
      safeVariables.activationLink = safeVariables.activationLink.replace(
        /token=[^&]+/i,
        'token=[redacted]',
      );
    }

    this.logger.log(
      `Notification queued template=${payload.templateId} to=${payload.to} vars=${JSON.stringify(safeVariables)}`,
    );
  }
}
