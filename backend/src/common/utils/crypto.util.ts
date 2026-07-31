import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateRawToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/** Placeholder hash for inactive accounts created on approval (FR-006). */
export async function placeholderPasswordHash(): Promise<string> {
  return hashPassword(generateRawToken(24));
}
