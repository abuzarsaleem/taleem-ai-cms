/**
 * Postgres enum: verification_token_type
 */
export enum VerificationTokenType {
  ACTIVATION = 'ACTIVATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFY = 'EMAIL_VERIFY',
}

export const VERIFICATION_TOKEN_TYPE_ENUM = 'verification_token_type';

export enum PhotoUploadStatus {
  TEMP = 'TEMP',
  ATTACHED = 'ATTACHED',
  EXPIRED = 'EXPIRED',
}
