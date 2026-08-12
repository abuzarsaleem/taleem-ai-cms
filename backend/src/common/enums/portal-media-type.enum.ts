/**
 * PortalMedia discriminators used by `portal_media.media_type`.
 *
 * Note: we intentionally keep this as a TypeScript enum (not a DB enum)
 * to avoid repeated migrations when new image types are introduced.
 */
export enum PortalMediaType {
  ALUMNI_PHOTO = 'ALUMNI_PHOTO',
  REGISTRATION_PHOTO = 'REGISTRATION_PHOTO',
  ANNOUNCEMENT_IMAGE = 'ANNOUNCEMENT_IMAGE',
  EVENT_IMAGE = 'EVENT_IMAGE',
}

export const PORTAL_MEDIA_TYPE_ENUM = 'portal_media_type';

