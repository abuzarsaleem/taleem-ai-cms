const DEFAULT_ALUMNI_PORTAL_ORIGIN = 'http://localhost:5173';

export function alumniPortalOrigin(): string {
  const raw = process.env.ALUMNI_PORTAL_URL ?? DEFAULT_ALUMNI_PORTAL_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_ALUMNI_PORTAL_ORIGIN;
  }
}

export function alumniPortalLink(path: string, query?: Record<string, string>): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalized, `${alumniPortalOrigin()}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
