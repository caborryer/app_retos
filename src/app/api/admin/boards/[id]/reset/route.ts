import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/boards/[id]/reset
 * Wipes all user progress (task + challenge) for every challenge in a board.
 * Admin only.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;

  // Verify board exists
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  // Delete all task-level submissions for this board
  const { count: tasksDeleted } = await prisma.userTaskProgress.deleteMany({
    where: { task: { challenge: { boardId: id } } },
  });

  // Delete all challenge-level progress for this board
  const { count: challengesDeleted } = await prisma.userChallengeProgress.deleteMany({
    where: { challenge: { boardId: id } },
  });

  return NextResponse.json({
    ok: true,
    tasksDeleted,
    challengesDeleted,
  });
}
