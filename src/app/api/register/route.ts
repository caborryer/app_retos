import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  consumeInviteAndCreateMember,
  InviteValidationError,
} from '@/lib/organization-access';
import { validatePassword } from '@/lib/password-policy';
import { issueAndSendVerificationEmail } from '@/lib/send-verification';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

/**
 * POST /api/register
 * Body: { name, email, password, inviteToken }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, password, inviteToken } = body as {
    name?: string;
    email?: string;
    password?: string;
    inviteToken?: string;
  };

  if (!inviteToken?.trim()) {
    return NextResponse.json(
      { error: 'Se requiere un enlace de invitación válido' },
      { status: 400 }
    );
  }

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const limit = await checkRateLimit(rateLimitKey('register', `${ip}:${normalizedEmail}`), 5);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);

    const userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashed,
          role: 'USER',
        },
      });
      await consumeInviteAndCreateMember(user.id, inviteToken, tx);
      return user.id;
    });

    let emailResult: { sent: boolean; devLink?: string } = { sent: false };
    try {
      emailResult = await issueAndSendVerificationEmail(userId);
    } catch {
      return NextResponse.json(
        {
          ok: true,
          verifyEmailRequired: true,
          emailSent: false,
          message:
            'Cuenta creada, pero no pudimos enviar el correo de verificación. Usa reenviar desde el login.',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        verifyEmailRequired: true,
        emailSent: emailResult.sent,
        devLink: emailResult.devLink,
        message: 'Revisa tu bandeja para activar la cuenta.',
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof InviteValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
