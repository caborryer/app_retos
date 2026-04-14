import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/boards/:id/start
 * Marks all challenges on the board as IN_PROGRESS for the current user (bingo "started").
 * Board must be active and have exactly 8 challenges.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    select: { id: true, active: true },
  });

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }
  if (!board.active) {
    return NextResponse.json({ error: 'Este tablero no está activo' }, { status: 400 });
  }

  const challenges = await prisma.challenge.findMany({
    where: { boardId: params.id },
    select: { id: true },
  });

  if (challenges.length !== 8) {
    return NextResponse.json(
      { error: `El tablero debe tener 8 retos para poder iniciarlo (actual: ${challenges.length}).` },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const now = new Date();

  await prisma.$transaction(
    challenges.map((c) =>
      prisma.userChallengeProgress.upsert({
        where: { userId_challengeId: { userId, challengeId: c.id } },
        update: { status: 'IN_PROGRESS', startedAt: now },
        create: {
          userId,
          challengeId: c.id,
          status: 'IN_PROGRESS',
          startedAt: now,
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
