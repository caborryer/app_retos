import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/expiry-reminders
 * Runs daily via Vercel Cron (configured in vercel.json).
 * Finds boards whose endDate is 7 days from now (±12h window) and notifies
 * users who still have incomplete challenges in that board.
 *
 * Protected by CRON_SECRET env var.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // Target window: boards ending between 6.5 and 7.5 days from now
  const windowStart = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000);

  const boards = await prisma.board.findMany({
    where: {
      active: true,
      endDate: { gte: windowStart, lte: windowEnd },
    },
    include: {
      challenges: { select: { id: true } },
    },
  });

  if (boards.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 });
  }

  let totalNotified = 0;

  for (const board of boards) {
    const challengeIds = board.challenges.map((c) => c.id);
    if (challengeIds.length === 0) continue;

    // Users who have at least one non-completed challenge in this board
    const progresses = await prisma.userChallengeProgress.findMany({
      where: {
        challengeId: { in: challengeIds },
        status: { not: 'COMPLETED' },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (progresses.length === 0) continue;

    const endDateStr = board.endDate!.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
    });

    await prisma.notification.createMany({
      data: progresses.map(({ userId }) => ({
        userId,
        title: '¡Te queda una semana!',
        message: `El tablero "${board.title}" finaliza el ${endDateStr}. ¡Completa tus retos pendientes antes de que sea tarde!`,
        type: 'warning',
        actionUrl: '/home',
      })),
      skipDuplicates: true,
    });

    totalNotified += progresses.length;
  }

  return NextResponse.json({ ok: true, notified: totalNotified });
}
