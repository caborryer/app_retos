import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type DeleteBody = {
  confirmText?: unknown;
};

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as DeleteBody;
  const confirmText = typeof body.confirmText === 'string' ? body.confirmText.trim() : '';
  if (confirmText !== 'ELIMINAR') {
    return NextResponse.json(
      { error: 'Confirmación inválida. Escribe ELIMINAR para continuar.' },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}

