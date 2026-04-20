import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Body = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const currentPassword =
    typeof body.currentPassword === 'string' ? body.currentPassword.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Debes enviar la contraseña actual y la nueva contraseña.' },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe tener al menos 8 caracteres.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      {
        error:
          'No encontramos una contraseña local para esta cuenta. Si usas Google, inicia sesión con Google.',
      },
      { status: 400 }
    );
  }

  let currentMatches = false;
  if (user.password.startsWith('$2')) {
    currentMatches = await bcrypt.compare(currentPassword, user.password);
  } else {
    currentMatches = user.password === currentPassword;
  }

  if (!currentMatches) {
    return NextResponse.json({ error: 'La contraseña actual no coincide.' }, { status: 400 });
  }

  const isSamePassword = await bcrypt.compare(newPassword, await bcrypt.hash(currentPassword, 12));
  if (isSamePassword) {
    return NextResponse.json(
      { error: 'La nueva contraseña no puede ser igual a la actual.' },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}

