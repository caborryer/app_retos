import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  encryptTotpSecret,
  generateTotpSecret,
  getTotpQrDataUrl,
} from '@/lib/mfa';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (user.mfaEnabled) {
    return NextResponse.json({ error: 'MFA ya está activo' }, { status: 400 });
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecretEncrypted: encryptTotpSecret(secret) },
  });

  const qrDataUrl = await getTotpQrDataUrl(session.user.email, secret);

  return NextResponse.json({ qrDataUrl, secret });
}
