import { NextResponse } from 'next/server';
import { consumeAuthToken } from '@/lib/auth-tokens';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/verify-email?token=...
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const userId = await consumeAuthToken(token, 'EMAIL_VERIFY');
  if (!userId) {
    return NextResponse.json(
      { error: 'El enlace no es válido o ha expirado.' },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
