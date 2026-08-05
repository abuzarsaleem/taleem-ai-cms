export type NotificationTemplateId =
  | 'activation_link'
  | 'resend_activation'
  | 'approval_with_activation_link'
  | 'rejection_with_reason'
  | 'contact_request_forwarded'
  | 'contact_request_approved'
  | 'contact_request_rejected';

export interface NotificationPayload {
  to: string;
  templateId: NotificationTemplateId;
  variables: Record<string, string>;
}

export interface INotificationSender {
  send(payload: NotificationPayload): Promise<void>;
}
