import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { decryptSecret, encryptSecret } from '@/lib/secret-crypto';

const APP_NAME = 'Box Challenge';
const EPOCH_TOLERANCE = 30;

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(email: string, secret: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  });
}

export async function getTotpQrDataUrl(email: string, secret: string): Promise<string> {
  return QRCode.toDataURL(getTotpUri(email, secret), { margin: 1, width: 220 });
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const normalized = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const result = verifySync({
    secret,
    token: normalized,
    epochTolerance: EPOCH_TOLERANCE,
  });
  return result.valid;
}

export function encryptTotpSecret(secret: string): string {
  return encryptSecret(secret);
}

export function decryptTotpSecret(encrypted: string): string {
  return decryptSecret(encrypted);
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = randomBytes(3).toString('hex').toUpperCase();
    codes.push(`${part.slice(0, 4)}-${part.slice(4, 8)}`);
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c.replace(/-/g, '').toUpperCase(), 10)));
}

export async function verifyBackupCode(
  code: string,
  hashes: string[]
): Promise<{ valid: boolean; index: number }> {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(normalized, hashes[i])) {
      return { valid: true, index: i };
    }
  }
  return { valid: false, index: -1 };
}
