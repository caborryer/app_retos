import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { verifyUserPassword } from '@/lib/credentials-auth';
import { decryptTotpSecret, verifyTotpCode } from '@/lib/mfa';

type Body = { password?: string; code?: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const password = typeof body.password === 'string' ? body.password : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!password || !code) {
    return NextResponse.json(
      { error: 'Contraseña y código TOTP requeridos' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true, mfaSecretEncrypted: true },
  });

  if (!user?.mfaEnabled || !user.mfaSecretEncrypted) {
    return NextResponse.json({ error: 'MFA no está activo' }, { status: 400 });
  }

  const passwordOk = await verifyUserPassword(session.user.id, password);
  if (!passwordOk) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 400 });
  }

  const secret = decryptTotpSecret(user.mfaSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json({ error: 'Código TOTP incorrecto' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaEnabled: false,
      mfaSecretEncrypted: null,
      mfaBackupCodeHashes: [],
    },
  });

  return NextResponse.json({ ok: true });
}
