import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationSender,
  NotificationPayload,
  NotificationTemplateId,
} from '../../../common/interfaces/notification-sender.interface';

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
    const { subject, html, text } = this.render(payload);

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

  private render(payload: NotificationPayload): {
    subject: string;
    html: string;
    text: string;
  } {
    const name = payload.variables.fullName ?? 'Alumni';
    const link = payload.variables.activationLink ?? '';
    const reason = payload.variables.reason ?? '';
    const requesterName = payload.variables.requesterName ?? 'An alumnus';
    const targetName = payload.variables.targetName ?? 'an alumnus';
    const rejectionReason = payload.variables.rejectionReason ?? '';

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
      case 'contact_request_forwarded':
        return {
          subject: 'New alumni contact request',
          text: `Hi ${name},\n\n${requesterName} requested your contact details.\n\nReason: ${reason}\n\nPlease review this in the alumni portal.`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(requesterName)} requested your contact details.</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p><p>Please review this in the alumni portal.</p>`,
        };
      case 'contact_request_approved':
        return {
          subject: 'Contact request approved',
          text: `Hi ${name},\n\n${targetName} approved your contact request. You can now view their contact details in the directory.`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(targetName)} approved your contact request. You can now view their contact details in the directory.</p>`,
        };
      case 'contact_request_rejected':
        return {
          subject: 'Contact request update',
          text: `Hi ${name},\n\nYour contact request to ${targetName} was not approved.${rejectionReason ? `\n\nReason: ${rejectionReason}` : ''}`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Your contact request to ${escapeHtml(targetName)} was not approved.</p>${rejectionReason ? `<p><strong>Reason:</strong> ${escapeHtml(rejectionReason)}</p>` : ''}`,
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
