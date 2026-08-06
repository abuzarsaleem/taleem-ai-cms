import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  INotificationSender,
  NotificationPayload,
} from '../../../common/interfaces/notification-sender.interface';
import { renderNotificationEmail } from './email-templates';

@Injectable()
export class ResendNotificationSender implements INotificationSender {
  private readonly logger = new Logger(ResendNotificationSender.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when NOTIFICATION_DRIVER=resend');
    }
    this.client = new Resend(apiKey);
    this.from =
      process.env.RESEND_FROM_EMAIL ??
      'Taleem AI <onboarding@resend.dev>';
  }

  async send(payload: NotificationPayload): Promise<void> {
    const { subject, html, text } = renderNotificationEmail(payload);

    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: payload.to,
      subject,
      html,
      text,
    });

    if (error) {
      this.logger.error(
        `Resend failed template=${payload.templateId} to=${payload.to}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    this.logger.log(
      `Resend sent template=${payload.templateId} to=${payload.to} id=${data?.id ?? 'n/a'}`,
    );
  }
}
