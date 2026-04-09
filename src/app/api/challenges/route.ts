import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/challenges?boardId=xxx
 * Returns challenges for a board enriched with the authenticated user's progress.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get('boardId');

  const where = boardId ? { boardId } : {};

  const challenges = await prisma.challenge.findMany({
    where,
    include: {
      tasks: {
        include: {
          userProgress: {
            where: { userId: session.user.id },
          },
        },
      },
      userProgress: {
        where: { userId: session.user.id },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Merge user progress into each challenge/task so the frontend gets a flat shape
  const result = challenges.map((c: typeof challenges[number]) => {
    const userChallenge = c.userProgress[0] ?? null;
    const tasks = c.tasks.map((t: typeof c.tasks[number]) => {
      const up = t.userProgress[0] ?? null;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        photoRequired: t.photoRequired,
        linkRequired: t.linkRequired,
        completed: up?.completed ?? false,
        photoUrl: up?.photoUrl ?? null,
        linkUrl: up?.linkUrl ?? null,
        completedAt: up?.completedAt ?? null,
        validationStatus: (up?.validationStatus ?? 'PENDING').toLowerCase(),
        rejectionReason: up?.rejectionReason ?? null,
      };
    });

    const hasApprovedEvidence = tasks.some(
      (t) => t.validationStatus === 'approved'
    );
    const completedTasks = tasks.filter((t: { completed: boolean }) => t.completed).length;
    const computedProgress = tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

    // Fallback safeguard:
    // If any task has been approved by admin, treat the challenge as completed
    // even if challengeProgress row is temporarily stale.
    const normalizedStatus = hasApprovedEvidence
      ? 'completed'
      : (userChallenge?.status ?? 'NOT_STARTED').toLowerCase();

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category.toLowerCase(),
      difficulty: c.difficulty.toLowerCase(),
      points: c.points,
      duration: c.duration,
      icon: c.icon,
      color: c.color,
      images: c.images,
      participants: c.participants,
      boardId: c.boardId,
      status: normalizedStatus,
      startedAt: userChallenge?.startedAt ?? null,
      completedAt: userChallenge?.completedAt ?? null,
      progress: hasApprovedEvidence ? 100 : computedProgress,
      tasks,
    };
  });

  return NextResponse.json(result);
}
