import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  INotificationSender,
  NotificationPayload,
  NotificationTemplateId,
} from '../../../common/interfaces/notification-sender.interface';

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
    const { subject, html, text } = this.render(payload);

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

  private render(payload: NotificationPayload): {
    subject: string;
    html: string;
    text: string;
  } {
    const name = payload.variables.fullName ?? 'Alumni';
    const link = payload.variables.activationLink ?? '';
    const reason = payload.variables.reason ?? '';

    switch (payload.templateId as NotificationTemplateId) {
      case 'approval_with_activation_link':
      case 'activation_link':
        return {
          subject: 'Your Taleem AI alumni account is approved',
          text: `Hi ${name},\n\nYour registration has been approved. Activate your account:\n${link}\n\nThis link expires in 48 hours.`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Your registration has been approved. Activate your account:</p><p><a href="${escapeAttr(link)}">Activate account</a></p><p>This link expires in 48 hours.</p>`,
        };
      case 'resend_activation':
        return {
          subject: 'Your Taleem AI activation link',
          text: `Hi ${name},\n\nHere is a new activation link:\n${link}\n\nThis link expires in 48 hours.`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Here is a new activation link:</p><p><a href="${escapeAttr(link)}">Activate account</a></p><p>This link expires in 48 hours.</p>`,
        };
      case 'rejection_with_reason':
        return {
          subject: 'Taleem AI registration update',
          text: `Hi ${name},\n\nYour registration was not approved.\n\nReason: ${reason}\n\nYou may submit a new registration if needed.`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Your registration was not approved.</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p><p>You may submit a new registration if needed.</p>`,
        };
      default:
        return {
          subject: 'Taleem AI notification',
          text: `Hi ${name}`,
          html: `<p>Hi ${escapeHtml(name)}</p>`,
        };
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
