import { prisma } from '@/lib/prisma';

type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSec: number };

const WINDOW_MS = 15 * 60 * 1000;

export async function checkRateLimit(
  key: string,
  maxAttempts: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const existing = await prisma.authRateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStart) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { allowed: true };
  }

  if (existing.count >= maxAttempts) {
    const retryAfterMs = existing.windowStart.getTime() + WINDOW_MS - now.getTime();
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  await prisma.authRateLimit.update({
    where: { key },
    data: { count: existing.count + 1 },
  });

  return { allowed: true };
}

export function rateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier.toLowerCase().trim()}`;
}
