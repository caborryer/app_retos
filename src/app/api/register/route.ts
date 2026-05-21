import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  consumeInviteAndCreateMember,
  InviteValidationError,
} from '@/lib/organization-access';

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

  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashed,
          role: 'USER',
        },
      });
      await consumeInviteAndCreateMember(user.id, inviteToken, tx);
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof InviteValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
