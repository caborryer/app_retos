import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'mfa_pending';
const TTL_SEC = 5 * 60;

function getSigningKey(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSigningKey()).update(payload).digest('base64url');
}

export function createMfaPendingToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const body = `${userId}.${exp}`;
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyMfaPendingToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const body = `${userId}.${expStr}`;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return userId;
}

export const MFA_PENDING_COOKIE = COOKIE_NAME;
export const MFA_PENDING_MAX_AGE = TTL_SEC;
