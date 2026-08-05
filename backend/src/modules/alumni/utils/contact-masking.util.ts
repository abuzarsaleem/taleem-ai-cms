/** Mask sensitive contact fields for alumni directory privacy. */

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***';
  if (user.length === 1) return `*@${domain}`;
  if (user.length === 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.max(user.length - 2, 1))}${user[user.length - 1]}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return '****';

  // Keep leading + / country-ish prefix when present
  const hasPlus = trimmed.startsWith('+');
  const countryLen = hasPlus ? Math.min(3, Math.max(digits.length - 7, 1)) : 0;
  const country = digits.slice(0, countryLen);
  const local = digits.slice(countryLen);
  const visibleLocal = local.slice(0, Math.min(3, local.length));
  const masked = '*'.repeat(Math.max(local.length - visibleLocal.length, 4));
  return `${hasPlus ? '+' : ''}${country}${country ? ' ' : ''}${visibleLocal}${masked}`;
}
