import { NextResponse } from 'next/server';
import { findUserByEmail, verifyUserPassword } from '@/lib/credentials-auth';
import { createAuthToken } from '@/lib/auth-tokens';
import {
  createMfaPendingToken,
  MFA_PENDING_COOKIE,
  MFA_PENDING_MAX_AGE,
} from '@/lib/mfa-pending';
import { verifyTotpCode, decryptTotpSecret, verifyBackupCode } from '@/lib/mfa';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

type Body = {
  email?: string;
  password?: string;
  totp?: string;
  backupCode?: string;
};

/**
 * POST /api/auth/login
 * Validates credentials; returns sessionToken for signIn or mfaRequired.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const totp = typeof body.totp === 'string' ? body.totp.trim() : '';
  const backupCode = typeof body.backupCode === 'string' ? body.backupCode.trim() : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const limit = await checkRateLimit(rateLimitKey('login', `${ip}:${email}`), 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const passwordOk = await verifyUserPassword(user.id, password);
  if (!passwordOk) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error: 'Confirma tu email antes de entrar.',
        code: 'EMAIL_NOT_VERIFIED',
      },
      { status: 403 }
    );
  }

  if (user.mfaEnabled) {
    if (!totp && !backupCode) {
      const pending = createMfaPendingToken(user.id);
      const res = NextResponse.json({ mfaRequired: true });
      res.cookies.set(MFA_PENDING_COOKIE, pending, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: MFA_PENDING_MAX_AGE,
      });
      return res;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaSecretEncrypted: true, mfaBackupCodeHashes: true },
    });

    if (!dbUser?.mfaSecretEncrypted) {
      return NextResponse.json({ error: 'MFA mal configurado' }, { status: 500 });
    }

    let mfaOk = false;
    if (totp) {
      const secret = decryptTotpSecret(dbUser.mfaSecretEncrypted);
      mfaOk = verifyTotpCode(secret, totp);
    } else if (backupCode) {
      const result = await verifyBackupCode(backupCode, dbUser.mfaBackupCodeHashes);
      if (result.valid) {
        mfaOk = true;
        const nextHashes = [...dbUser.mfaBackupCodeHashes];
        nextHashes.splice(result.index, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { mfaBackupCodeHashes: nextHashes },
        });
      }
    }

    if (!mfaOk) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 });
    }
  }

  const sessionToken = await createAuthToken(user.id, 'MFA_LOGIN_SESSION');
  return NextResponse.json({ ok: true, sessionToken, role: user.role });
}
