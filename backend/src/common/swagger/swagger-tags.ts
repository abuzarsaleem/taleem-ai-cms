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

/** Strip global prefix so path keys match regardless of api/v1. */
export function normalizeSwaggerPath(path: string): string {
  return path.replace(/^\/api\/v\d+/, '');
}

/**
 * Auth & Registration onboarding order in Swagger (admin first, then alumni phases).
 */
export const AUTH_REGISTRATION_OPERATION_ORDER: string[] = [
  'post /admin/auth/login',
  'get /admin/registrations',
  'get /admin/registrations/{id}',
  'patch /admin/registrations/{id}',
  'post /auth/upload-photo',
  'post /auth/register',
  'post /auth/resend-activation',
  'post /auth/activate',
  'post /auth/reset-password',
  'post /auth/login',
  'post /auth/forgot-password',
];

export function authRegistrationSortKey(path: string, method: string): number {
  const key = `${method.toLowerCase()} ${normalizeSwaggerPath(path)}`;
  const index = AUTH_REGISTRATION_OPERATION_ORDER.indexOf(key);
  return index === -1 ? AUTH_REGISTRATION_OPERATION_ORDER.length + 1 : index;
}
