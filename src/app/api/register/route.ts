import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/register
 * Body: { name: string; email: string; password: string }
 * Creates a new USER-role account. Public endpoint.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, password } = body as { name?: string; email?: string; password?: string };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: 'USER',
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
