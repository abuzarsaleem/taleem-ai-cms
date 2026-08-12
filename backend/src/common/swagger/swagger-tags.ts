export const SWAGGER_TAGS = {
  AUTH_REGISTRATION: 'Auth & Registration',
  DASHBOARD: 'Dashboard',
  EVENTS: 'Events',
  ANNOUNCEMENTS: 'Announcements',
  CONTACT_REQUESTS: 'Contact Requests',
  ALUMNI: 'Alumni',
  PROFILE_CAREER: 'Profile & Career',
  CATALOG: 'Catalog',
} as const;

export const SWAGGER_TAG_ORDER: string[] = [
  SWAGGER_TAGS.AUTH_REGISTRATION,
  SWAGGER_TAGS.DASHBOARD,
  SWAGGER_TAGS.EVENTS,
  SWAGGER_TAGS.ANNOUNCEMENTS,
  SWAGGER_TAGS.CONTACT_REQUESTS,
  SWAGGER_TAGS.ALUMNI,
  SWAGGER_TAGS.PROFILE_CAREER,
  SWAGGER_TAGS.CATALOG,
];

export function isAdminSwaggerPath(path: string): boolean {
  return /\/admin(?:\/|$)/.test(path);
}
