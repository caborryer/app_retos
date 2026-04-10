import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/notifications/read
 * Body: { ids?: string[] }
 * If ids is provided, marks those notifications as read.
 * If ids is omitted or empty, marks ALL user notifications as read.
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body?.ids;

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
