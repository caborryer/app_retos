import type { AuthTokenType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateRawToken, hashToken } from '@/lib/auth-token-crypto';

const DEFAULT_TTL_HOURS: Record<AuthTokenType, number> = {
  EMAIL_VERIFY: 48,
  MFA_LOGIN_SESSION: 5 / 60, // 5 minutes
};

export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlHours = DEFAULT_TTL_HOURS[type],
  tx?: Prisma.TransactionClient
): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const client = tx ?? prisma;

  await client.authToken.deleteMany({ where: { userId, type } });
  await client.authToken.create({
    data: { userId, type, tokenHash, expiresAt },
  });

  return raw;
}

export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType
): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const now = new Date();

  const row = await prisma.authToken.findFirst({
    where: { type, tokenHash, expiresAt: { gt: now } },
    select: { id: true, userId: true },
  });

  if (!row) return null;

  await prisma.authToken.delete({ where: { id: row.id } });
  return row.userId;
}
