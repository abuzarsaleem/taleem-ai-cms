/**
 * Postgres enum: registration_status
 * Used by alumni_registration_request.status
 */
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const REGISTRATION_STATUS_ENUM = 'registration_status';
