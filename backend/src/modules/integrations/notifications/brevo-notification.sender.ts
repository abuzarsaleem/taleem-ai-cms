import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationSender,
  NotificationPayload,
} from '../../../common/interfaces/notification-sender.interface';
import { renderNotificationEmail } from './email-templates';

@Injectable()
export class BrevoNotificationSender implements INotificationSender {
  private readonly logger = new Logger(BrevoNotificationSender.name);
  private readonly apiKey: string;
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is required when NOTIFICATION_DRIVER=brevo');
    }
    this.apiKey = apiKey;

    const from =
      process.env.BREVO_FROM_EMAIL ??
      process.env.RESEND_FROM_EMAIL ??
      'IKS <rao.shan@ikslogics.com>';
    const parsed = parseFrom(from);
    this.senderName = parsed.name;
    this.senderEmail = parsed.email;
  }

  async send(payload: NotificationPayload): Promise<void> {
    const { subject, html, text } = renderNotificationEmail(payload);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: payload.to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const message = `Brevo HTTP ${response.status}: ${body}`;
      this.logger.error(
        `Brevo failed template=${payload.templateId} to=${payload.to}: ${message}`,
      );
      throw new Error(message);
    }

    const data = (await response.json()) as { messageId?: string };
    this.logger.log(
      `Brevo sent template=${payload.templateId} to=${payload.to} id=${data.messageId ?? 'n/a'}`,
    );
  }
}

function parseFrom(value: string): { name: string; email: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1].trim() || 'Taleem AI',
      email: match[2].trim(),
    };
  }
  return { name: 'Taleem AI', email: value.trim() };
}
