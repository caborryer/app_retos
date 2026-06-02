import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

type Body = {
  email?: string;
  password?: string;
};

/**
 * POST /api/auth/login
 * Pre-validates credentials before NextAuth signIn (avoids NextAuth catch-all conflict).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  let passwordOk = false;
  if (user.password?.startsWith('$2')) {
    passwordOk = await bcrypt.compare(password, user.password);
  } else {
    passwordOk = user.password === password;
  }

  if (!passwordOk) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, role: user.role });
}
