import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getBoardFullCompletionOrder } from '@/lib/board-live-ranking';

/**
 * GET /api/boards/winner
 *
 * Returns the winner (first to complete all challenges) of a board.
 * Query params (one required):
 *   - boardId  — exact board ID
 *   - title    — board title search (case-insensitive, e.g. ?title=MFK)
 *
 * Response:
 * {
 *   board: { id, title, emoji, totalChallenges },
 *   winner: { place: 1, userId, name, finishedAt } | null,
 *   completionOrder: Array<{ place, userId, name, finishedAt }>,
 *   totalFinishers: number
 * }
 *
 * Auth: requires authenticated session (USER or ADMIN).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get('boardId');
  const titleParam = searchParams.get('title');

  if (!boardId && !titleParam) {
    return NextResponse.json(
      { error: 'Se requiere al menos un parámetro: boardId o title' },
      { status: 400 }
    );
  }

  // Resolve the board
  let board: { id: string; title: string; emoji: string } | null = null;

  if (boardId) {
    board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, title: true, emoji: true },
    });
  } else if (titleParam) {
    // Case-insensitive search — returns first match
    board = await prisma.board.findFirst({
      where: { title: { contains: titleParam, mode: 'insensitive' } },
      select: { id: true, title: true, emoji: true },
    });
  }

  if (!board) {
    return NextResponse.json({ error: 'Tablero no encontrado' }, { status: 404 });
  }

  const totalChallenges = await prisma.challenge.count({
    where: { boardId: board.id },
  });

  if (totalChallenges === 0) {
    return NextResponse.json({
      board: { ...board, totalChallenges: 0 },
      winner: null,
      completionOrder: [],
      totalFinishers: 0,
    });
  }

  // Ordered by MAX(completedAt) ASC — earliest last-challenge approval = winner
  const finishOrder = await getBoardFullCompletionOrder(prisma, board.id);

  const completionOrder = finishOrder.map((entry, idx) => ({
    place: idx + 1,
    userId: entry.userId,
    name: entry.name,
    finishedAt: entry.finishedAt.toISOString(),
  }));

  const winner = completionOrder[0] ?? null;

  return NextResponse.json({
    board: {
      id: board.id,
      title: board.title,
      emoji: board.emoji,
      totalChallenges,
    },
    winner,
    completionOrder,
    totalFinishers: completionOrder.length,
  });
}
