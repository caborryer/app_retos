import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  decryptTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCodes,
} from '@/lib/mfa';

type Body = { code?: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true, mfaSecretEncrypted: true },
  });

  if (!user?.mfaSecretEncrypted) {
    return NextResponse.json({ error: 'Primero inicia la configuración MFA' }, { status: 400 });
  }

  if (user.mfaEnabled) {
    return NextResponse.json({ error: 'MFA ya está activo' }, { status: 400 });
  }

  const secret = decryptTotpSecret(user.mfaSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
  }

  const backupCodes = generateBackupCodes();
  const backupHashes = await hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaEnabled: true,
      mfaBackupCodeHashes: backupHashes,
    },
  });

  return NextResponse.json({ ok: true, backupCodes });
}
