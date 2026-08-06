import {
  NotificationPayload,
  NotificationTemplateId,
} from '../../../common/interfaces/notification-sender.interface';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  name: 'Taleem AI',
  accent: '#0d9488',
  accentDeep: '#0a6b63',
  ink: '#15202b',
  muted: '#617283',
  line: '#d7dee7',
  bg: '#eef3f2',
  surface: '#ffffff',
  danger: '#b42318',
  dangerBg: '#fef3f2',
  ok: '#067647',
  okBg: '#ecfdf3',
};

export function renderNotificationEmail(
  payload: NotificationPayload,
): RenderedEmail {
  const v = payload.variables;
  const name = v.fullName ?? 'Alumni';
  const link = v.activationLink ?? '';
  const resetLink = v.resetLink ?? '';
  const reason = v.reason ?? '';
  const requesterName = v.requesterName ?? 'An alumnus';
  const targetName = v.targetName ?? 'an alumnus';
  const rejectionReason = v.rejectionReason ?? '';
  const eventTitle = v.eventTitle ?? 'an event';
  const eventType = v.eventType ?? '';
  const eventDate = v.eventDate ?? '';
  const startTime = v.startTime ?? '';
  const endTime = v.endTime ?? '';
  const venue = v.venue ?? '';
  const guestSpeaker = v.guestSpeaker ?? '';
  const description = v.description ?? '';
  const announcementTitle = v.announcementTitle ?? 'an announcement';
  const category = v.category ?? '';
  const content = v.content ?? '';
  const imageUrl = v.imageUrl ?? '';
  const portalUrl =
    process.env.ALUMNI_PORTAL_URL ??
    process.env.FRONTEND_URL ??
    'http://localhost:5173';

  switch (payload.templateId as NotificationTemplateId) {
    case 'approval_with_activation_link':
    case 'activation_link':
      return registrationApproved(name, link);
    case 'resend_activation':
      return registrationResendActivation(name, link);
    case 'rejection_with_reason':
      return registrationRejected(name, reason);
    case 'event_published':
      return eventPublished({
        name,
        eventTitle,
        eventType,
        eventDate,
        startTime,
        endTime,
        venue,
        guestSpeaker,
        description,
        portalUrl,
      });
    case 'announcement_published':
      return announcementPublished(
        name,
        announcementTitle,
        category,
        content,
        imageUrl,
      );
    case 'contact_request_forwarded':
      return contactForwarded(name, requesterName, reason, portalUrl);
    case 'contact_request_approved':
      return contactApproved(name, targetName, portalUrl);
    case 'contact_request_rejected':
      return contactRejected(name, targetName, rejectionReason);
    case 'password_reset':
      return passwordReset(name, resetLink);
    default:
      return {
        subject: `${BRAND.name} notification`,
        text: `Hi ${name}`,
        html: layout({
          preheader: 'You have a new notification',
          eyebrow: 'Notification',
          title: `Hello, ${escapeHtml(name)}`,
          bodyHtml: `<p style="${pStyle}">You have a new message from ${escapeHtml(BRAND.name)}.</p>`,
        }),
      };
  }
}

function registrationApproved(name: string, link: string): RenderedEmail {
  return {
    subject: `Welcome to ${BRAND.name} — activate your alumni account`,
    text: [
      `Hi ${name},`,
      '',
      'Great news — your alumni registration has been approved.',
      'Activate your account to access the directory, events, and more:',
      link,
      '',
      'This link expires in 48 hours.',
      '',
      `— ${BRAND.name}`,
    ].join('\n'),
    html: layout({
      preheader: 'Your alumni registration was approved. Activate your account.',
      eyebrow: 'Registration approved',
      title: `You're in, ${escapeHtml(name)}`,
      bodyHtml: `
        <p style="${pStyle}">Your alumni registration has been reviewed and <strong style="color:${BRAND.ok};">approved</strong>.</p>
        <p style="${pStyle}">Activate your account to join the community, browse the directory, and RSVP to events.</p>
        ${ctaButton(link, 'Activate your account')}
        ${infoNote('This activation link expires in <strong>48 hours</strong>. If it expires, request a new one from the portal.')}
      `,
    }),
  };
}

function registrationResendActivation(
  name: string,
  link: string,
): RenderedEmail {
  return {
    subject: `Your ${BRAND.name} activation link`,
    text: [
      `Hi ${name},`,
      '',
      'Here is a new activation link for your alumni account:',
      link,
      '',
      'This link expires in 48 hours.',
      '',
      `— ${BRAND.name}`,
    ].join('\n'),
    html: layout({
      preheader: 'Your new activation link is ready.',
      eyebrow: 'Account activation',
      title: 'Activate your alumni account',
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(name)}, here is a fresh activation link for your ${escapeHtml(BRAND.name)} alumni account.</p>
        ${ctaButton(link, 'Activate account')}
        ${infoNote('This link expires in <strong>48 hours</strong>.')}
      `,
    }),
  };
}

function registrationRejected(name: string, reason: string): RenderedEmail {
  return {
    subject: `${BRAND.name} registration update`,
    text: [
      `Hi ${name},`,
      '',
      'Your alumni registration was not approved.',
      `Reason: ${reason}`,
      '',
      'You may submit a new registration if needed.',
      '',
      `— ${BRAND.name}`,
    ].join('\n'),
    html: layout({
      preheader: 'An update on your alumni registration.',
      eyebrow: 'Registration update',
      title: `Hi ${escapeHtml(name)}`,
      bodyHtml: `
        <p style="${pStyle}">Thank you for applying to the ${escapeHtml(BRAND.name)} alumni network. After review, we were unable to approve this registration.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${BRAND.dangerBg};border:1px solid #fecdca;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.danger};">Reason</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${BRAND.ink};">${escapeHtml(reason || 'No reason provided')}</p>
            </td>
          </tr>
        </table>
        <p style="${pStyle}">You may correct the details and submit a new registration whenever you are ready.</p>
      `,
    }),
  };
}

function eventPublished(input: {
  name: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  guestSpeaker: string;
  description: string;
  portalUrl: string;
}): RenderedEmail {
  const timeLabel = [input.startTime, input.endTime]
    .filter(Boolean)
    .join(' – ');
  const details: Array<{ label: string; value: string }> = [
    { label: 'Date', value: input.eventDate },
    { label: 'Time', value: timeLabel },
    { label: 'Venue', value: input.venue },
  ];
  if (input.guestSpeaker) {
    details.push({ label: 'Guest speaker', value: input.guestSpeaker });
  }
  if (input.eventType) {
    details.push({ label: 'Type', value: formatLabel(input.eventType) });
  }

  const eventsUrl = `${input.portalUrl.replace(/\/$/, '')}/events`;

  return {
    subject: `New event: ${input.eventTitle}`,
    text: [
      `Hi ${input.name},`,
      '',
      'A new alumni event has been published.',
      '',
      input.eventTitle,
      input.eventDate
        ? `Date: ${input.eventDate}${timeLabel ? ` at ${timeLabel}` : ''}`
        : '',
      input.venue ? `Venue: ${input.venue}` : '',
      input.guestSpeaker ? `Guest speaker: ${input.guestSpeaker}` : '',
      input.description ? `\n${input.description}` : '',
      '',
      `RSVP in the alumni portal: ${eventsUrl}`,
      '',
      `— ${BRAND.name}`,
    ]
      .filter((line) => line !== '')
      .join('\n'),
    html: layout({
      preheader: `${input.eventTitle} — open in the alumni portal to RSVP.`,
      eyebrow: 'New alumni event',
      title: escapeHtml(input.eventTitle),
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(input.name)}, a new event is live for the alumni community.</p>
        ${input.description ? `<p style="${pStyle}">${escapeHtml(input.description)}</p>` : ''}
        ${detailsCard(details)}
        ${ctaButton(eventsUrl, 'View event & RSVP')}
        ${infoNote('Open the alumni portal to confirm your attendance.')}
      `,
    }),
  };
}

function announcementPublished(
  name: string,
  title: string,
  category: string,
  content: string,
  imageUrl: string,
): RenderedEmail {
  const imageBlock = imageUrl
    ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
          <tr>
            <td style="border-radius:12px;overflow:hidden;border:1px solid ${BRAND.line};">
              <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(title)}" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;" />
            </td>
          </tr>
        </table>
      `
    : '';

  return {
    subject: `Announcement: ${title}`,
    text: [
      `Hi ${name},`,
      '',
      `${title}${category ? ` (${category})` : ''}`,
      '',
      content,
      imageUrl ? `\nImage: ${imageUrl}` : '',
      '',
      `— ${BRAND.name}`,
    ]
      .filter((line) => line !== '')
      .join('\n'),
    html: layout({
      preheader: title,
      eyebrow: category ? formatLabel(category) : 'Announcement',
      title: escapeHtml(title),
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(name)},</p>
        ${imageBlock}
        <p style="${pStyle}">${escapeHtml(content)}</p>
      `,
    }),
  };
}

function contactForwarded(
  name: string,
  requesterName: string,
  reason: string,
  portalUrl: string,
): RenderedEmail {
  const inboxUrl = `${portalUrl.replace(/\/$/, '')}/contact-requests`;
  return {
    subject: 'New alumni contact request',
    text: `Hi ${name},\n\n${requesterName} requested your contact details.\n\nReason: ${reason}\n\nReview in the alumni portal: ${inboxUrl}`,
    html: layout({
      preheader: `${requesterName} requested your contact details.`,
      eyebrow: 'Contact request',
      title: 'Someone wants to connect',
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(name)}, <strong>${escapeHtml(requesterName)}</strong> requested your contact details.</p>
        ${detailsCard([{ label: 'Reason', value: reason || '—' }])}
        ${ctaButton(inboxUrl, 'Review request')}
      `,
    }),
  };
}

function contactApproved(
  name: string,
  targetName: string,
  portalUrl: string,
): RenderedEmail {
  const directoryUrl = `${portalUrl.replace(/\/$/, '')}/directory`;
  return {
    subject: 'Contact request approved',
    text: `Hi ${name},\n\n${targetName} approved your contact request. You can now view their contact details in the directory.`,
    html: layout({
      preheader: `${targetName} approved your contact request.`,
      eyebrow: 'Request approved',
      title: 'You are connected',
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(name)}, <strong>${escapeHtml(targetName)}</strong> approved your contact request. Their details are now available in the directory.</p>
        ${ctaButton(directoryUrl, 'Open directory')}
      `,
    }),
  };
}

function contactRejected(
  name: string,
  targetName: string,
  rejectionReason: string,
): RenderedEmail {
  return {
    subject: 'Contact request update',
    text: `Hi ${name},\n\nYour contact request to ${targetName} was not approved.${rejectionReason ? `\n\nReason: ${rejectionReason}` : ''}`,
    html: layout({
      preheader: 'An update on your contact request.',
      eyebrow: 'Request update',
      title: 'Request not approved',
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(name)}, your contact request to <strong>${escapeHtml(targetName)}</strong> was not approved.</p>
        ${
          rejectionReason
            ? detailsCard([{ label: 'Reason', value: rejectionReason }])
            : ''
        }
      `,
    }),
  };
}

function passwordReset(name: string, resetLink: string): RenderedEmail {
  return {
    subject: `Reset your ${BRAND.name} password`,
    text: `Hi ${name},\n\nReset your password using this link (expires in 1 hour):\n${resetLink}`,
    html: layout({
      preheader: 'Reset your password — link expires in 1 hour.',
      eyebrow: 'Security',
      title: 'Reset your password',
      bodyHtml: `
        <p style="${pStyle}">Hi ${escapeHtml(name)}, we received a request to reset your password.</p>
        ${ctaButton(resetLink, 'Reset password')}
        ${infoNote('This link expires in <strong>1 hour</strong>. If you did not request this, you can ignore this email.')}
      `,
    }),
  };
}

function layout(input: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(BRAND.name)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.surface};border:1px solid ${BRAND.line};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.accentDeep} 0%, ${BRAND.accent} 100%);padding:22px 28px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;color:#ffffff;letter-spacing:0.02em;">
                ${escapeHtml(BRAND.name)}
              </p>
              <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.82);">
                Alumni network
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.accent};">
                ${escapeHtml(input.eyebrow)}
              </p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.ink};">
                ${input.title}
              </h1>
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <hr style="border:none;border-top:1px solid ${BRAND.line};margin:8px 0 18px;" />
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                Sent by ${escapeHtml(BRAND.name)}. This email relates to your alumni account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  if (!href) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr>
        <td style="border-radius:10px;background:${BRAND.accent};">
          <a href="${escapeAttr(href)}" style="display:inline-block;padding:14px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function detailsCard(
  rows: Array<{ label: string; value: string }>,
): string {
  const filtered = rows.filter((r) => r.value && r.value.trim());
  if (!filtered.length) return '';

  const items = filtered
    .map(
      (row, index) => `
      <tr>
        <td style="padding:${index === 0 ? '14px' : '10px'} 16px ${index === filtered.length - 1 ? '14px' : '10px'};border-top:${index === 0 ? 'none' : `1px solid ${BRAND.line}`};">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(row.label)}</p>
          <p style="margin:0;font-size:15px;line-height:1.45;color:${BRAND.ink};">${escapeHtml(row.value)}</p>
        </td>
      </tr>`,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f7faf9;border:1px solid ${BRAND.line};border-radius:12px;">
      ${items}
    </table>
  `;
}

function infoNote(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;">
      <tr>
        <td style="padding:12px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:${BRAND.accentDeep};">
          ${html}
        </td>
      </tr>
    </table>
  `;
}

const pStyle = `margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.ink};`;

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
