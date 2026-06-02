import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueAndSendVerificationEmail } from '@/lib/send-verification';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

/**
 * POST /api/auth/resend-verification
 * Body: { email }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const limit = await checkRateLimit(rateLimitKey('resend-verify', `${ip}:${email}`), 5);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({
      ok: true,
      message: 'Si la cuenta existe y no está verificada, enviaremos un correo.',
    });
  }

  try {
    const result = await issueAndSendVerificationEmail(user.id);
    if (result.cooldownSec) {
      return NextResponse.json(
        { error: `Espera ${result.cooldownSec}s antes de reenviar.` },
        { status: 429 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: 'Si la cuenta existe y no está verificada, enviaremos un correo.',
      devLink: result.devLink,
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo enviar el correo. Intenta más tarde.' },
      { status: 500 }
    );
  }
}
