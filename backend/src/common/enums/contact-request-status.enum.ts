/**
 * Postgres enum: contact_request_status
 */
export enum ContactRequestStatus {
  PENDING_ADMIN = 'PENDING_ADMIN',
  REJECTED_BY_ADMIN = 'REJECTED_BY_ADMIN',
  PENDING_ALUMNI = 'PENDING_ALUMNI',
  REJECTED_BY_ALUMNI = 'REJECTED_BY_ALUMNI',
  APPROVED = 'APPROVED',
}

export const CONTACT_REQUEST_STATUS_ENUM = 'contact_request_status';
