import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAuthToken } from '@/lib/auth-tokens';
import { verifyMfaPendingToken, MFA_PENDING_COOKIE } from '@/lib/mfa-pending';
import { decryptTotpSecret, verifyBackupCode, verifyTotpCode } from '@/lib/mfa';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

type Body = { totp?: string; backupCode?: string };

/**
 * POST /api/auth/mfa/verify
 * Completes MFA step after /api/auth/login returned mfaRequired.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const pending = cookieStore.get(MFA_PENDING_COOKIE)?.value;
  const userId = pending ? verifyMfaPendingToken(pending) : null;

  if (!userId) {
    return NextResponse.json(
      { error: 'Sesión MFA expirada. Inicia sesión de nuevo.' },
      { status: 401 }
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const limit = await checkRateLimit(rateLimitKey('mfa-verify', `${ip}:${userId}`), 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const totp = typeof body.totp === 'string' ? body.totp.trim() : '';
  const backupCode = typeof body.backupCode === 'string' ? body.backupCode.trim() : '';

  if (!totp && !backupCode) {
    return NextResponse.json({ error: 'Ingresa el código' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
      mfaSecretEncrypted: true,
      mfaBackupCodeHashes: true,
      role: true,
    },
  });

  if (!user?.mfaEnabled || !user.mfaSecretEncrypted) {
    return NextResponse.json({ error: 'MFA no activo' }, { status: 400 });
  }

  let mfaOk = false;
  if (totp) {
    const secret = decryptTotpSecret(user.mfaSecretEncrypted);
    mfaOk = verifyTotpCode(secret, totp);
  } else if (backupCode) {
    const result = await verifyBackupCode(backupCode, user.mfaBackupCodeHashes);
    if (result.valid) {
      mfaOk = true;
      const nextHashes = [...user.mfaBackupCodeHashes];
      nextHashes.splice(result.index, 1);
      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodeHashes: nextHashes },
      });
    }
  }

  if (!mfaOk) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 });
  }

  const sessionToken = await createAuthToken(userId, 'MFA_LOGIN_SESSION');
  const res = NextResponse.json({ ok: true, sessionToken, role: user.role });
  res.cookies.set(MFA_PENDING_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
