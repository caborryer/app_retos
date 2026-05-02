import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserProfileMetrics } from '@/lib/profile-metrics';
import { getBoardFullCompletionOrder } from '@/lib/board-live-ranking';

export const dynamic = 'force-dynamic';

type ActivityItem = {
  id: string;
  type: 'start' | 'complete' | 'submission';
  title: string;
  icon: string;
  color: string;
  time: string;
};

type RankingEntry = {
  userId: string;
  name: string;
  completedChallenges: number;
  earnedPoints: number;
  isCurrentUser: boolean;
};

type RankingBlock = {
  boardId: string;
  boardTitle: string;
  boardEmoji: string;
  yourPosition: number;
  totalCompetitors: number;
  entries: RankingEntry[];
  trend: {
    direction: 'up' | 'down' | 'same' | 'new';
    delta: number;
  };
};

type BoardCompletionOrderBlock = {
  boardId: string;
  boardTitle: string;
  boardEmoji: string;
  entries: Array<{
    place: number;
    userId: string;
    name: string;
    finishedAt: string;
    isCurrentUser: boolean;
  }>;
};

function rankEntries(entries: RankingEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.completedChallenges !== a.completedChallenges) {
      return b.completedChallenges - a.completedChallenges;
    }
    if (b.earnedPoints !== a.earnedPoints) {
      return b.earnedPoints - a.earnedPoints;
    }
    return a.name.localeCompare(b.name);
  });
}

function getTrend(currentPosition: number, previousPosition: number) {
  if (previousPosition <= 0) {
    return { direction: 'new' as const, delta: 0 };
  }
  if (currentPosition < previousPosition) {
    return { direction: 'up' as const, delta: previousPosition - currentPosition };
  }
  if (currentPosition > previousPosition) {
    return { direction: 'down' as const, delta: currentPosition - previousPosition };
  }
  return { direction: 'same' as const, delta: 0 };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const requestedCompletionBoardId = searchParams.get('completionBoardId');

  const [metrics, challengeProgress, taskProgress] =
    await Promise.all([
      getUserProfileMetrics(prisma, userId),
      prisma.userChallengeProgress.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          challenge: {
            select: {
              title: true,
              icon: true,
              boardId: true,
              board: {
                select: {
                  title: true,
                  emoji: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 40,
      }),
      prisma.userTaskProgress.findMany({
        where: {
          userId,
          OR: [
            { completed: true },
            { photoUrl: { not: null } },
            { linkUrl: { not: null } },
          ],
        },
        select: {
          id: true,
          completedAt: true,
          updatedAt: true,
          task: {
            select: {
              title: true,
              challenge: {
                select: { title: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

  const latestBoardProgress = challengeProgress
    .map((cp) => ({
      boardId: cp.challenge.boardId,
      boardTitle: cp.challenge.board.title,
      boardEmoji: cp.challenge.board.emoji,
      lastTime:
        cp.completedAt?.getTime() ??
        cp.startedAt?.getTime() ??
        0,
    }))
    .sort((a, b) => b.lastTime - a.lastTime)[0];

  const userBoardIds = [...new Set(challengeProgress.map((cp) => cp.challenge.boardId))];

  let boardsForCompletionOrder: Array<{ boardId: string; title: string; emoji: string }> =
    [];

  if (userBoardIds.length > 0) {
    const boardRows = await prisma.board.findMany({
      where: { id: { in: userBoardIds } },
      select: { id: true, title: true, emoji: true },
      orderBy: { title: 'asc' },
    });
    boardsForCompletionOrder = boardRows.map((b) => ({
      boardId: b.id,
      title: b.title,
      emoji: b.emoji,
    }));
  }

  const activities: ActivityItem[] = [];
  const boardStartEvents = new Map<string, ActivityItem>();

  for (const cp of challengeProgress) {
    if (cp.completedAt && cp.status === 'COMPLETED') {
      activities.push({
        id: `complete-${cp.id}`,
        type: 'complete',
        title: `Completaste "${cp.challenge.title}"`,
        icon: cp.challenge.icon || '🏁',
        color: 'bg-green-100 text-green-600',
        time: cp.completedAt.toISOString(),
      });
    } else if (cp.startedAt) {
      const startEventKey = `${cp.challenge.boardId}-${cp.startedAt.toISOString()}`;
      boardStartEvents.set(startEventKey, {
        id: `start-board-${cp.challenge.boardId}-${cp.startedAt.toISOString()}`,
        type: 'start',
        title: `Comenzaste el tablero "${cp.challenge.board.title}"`,
        icon: cp.challenge.board.emoji || '🎯',
        color: 'bg-primary-100 text-primary-600',
        time: cp.startedAt.toISOString(),
      });
    }
  }

  activities.push(...boardStartEvents.values());

  for (const tp of taskProgress) {
    const time = tp.completedAt ?? tp.updatedAt;
    activities.push({
      id: `submission-${tp.id}`,
      type: 'submission',
      title: `Registraste actividad en "${tp.task.title}" (${tp.task.challenge.title})`,
      icon: '📸',
      color: 'bg-blue-100 text-blue-600',
      time: time.toISOString(),
    });
  }

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  let boardRanking: RankingBlock | null = null;

  if (latestBoardProgress?.boardId) {
    const trendCutoff = new Date();
    trendCutoff.setDate(trendCutoff.getDate() - 7);

    const boardRows = await prisma.userChallengeProgress.findMany({
      where: { challenge: { boardId: latestBoardProgress.boardId } },
      select: {
        userId: true,
        status: true,
        challenge: { select: { points: true } },
        user: { select: { name: true } },
      },
    });

    const boardPreviousRows = await prisma.userChallengeProgress.findMany({
      where: {
        challenge: { boardId: latestBoardProgress.boardId },
        completedAt: { lte: trendCutoff },
      },
      select: {
        userId: true,
        status: true,
        challenge: { select: { points: true } },
        user: { select: { name: true } },
      },
    });

    const byUser = new Map<string, RankingEntry>();

    for (const row of boardRows) {
      const existing =
        byUser.get(row.userId) ??
        {
          userId: row.userId,
          name: row.user.name,
          completedChallenges: 0,
          earnedPoints: 0,
          isCurrentUser: row.userId === userId,
        };

      if (row.status === 'COMPLETED') {
        existing.completedChallenges += 1;
        existing.earnedPoints += row.challenge.points;
      }

      byUser.set(row.userId, existing);
    }

    const sorted = rankEntries([...byUser.values()]);

    const previousByUser = new Map<string, RankingEntry>();
    for (const row of boardPreviousRows) {
      const existing =
        previousByUser.get(row.userId) ??
        {
          userId: row.userId,
          name: row.user.name,
          completedChallenges: 0,
          earnedPoints: 0,
          isCurrentUser: row.userId === userId,
        };
      if (row.status === 'COMPLETED') {
        existing.completedChallenges += 1;
        existing.earnedPoints += row.challenge.points;
      }
      previousByUser.set(row.userId, existing);
    }
    const previousSorted = rankEntries([...previousByUser.values()]);

    const yourPosition = sorted.findIndex((entry) => entry.userId === userId) + 1;
    const previousPosition = previousSorted.findIndex((entry) => entry.userId === userId) + 1;

    if (yourPosition > 0) {
      boardRanking = {
        boardId: latestBoardProgress.boardId,
        boardTitle: latestBoardProgress.boardTitle,
        boardEmoji: latestBoardProgress.boardEmoji,
        yourPosition,
        totalCompetitors: sorted.length,
        entries: sorted.slice(0, 8),
        trend: getTrend(yourPosition, previousPosition),
      };
    }
  }

  const globalTrendCutoff = new Date();
  globalTrendCutoff.setDate(globalTrendCutoff.getDate() - 7);

  const globalRows = await prisma.userChallengeProgress.findMany({
    where: { status: 'COMPLETED' },
    select: {
      userId: true,
      challenge: { select: { points: true } },
      user: { select: { name: true, role: true } },
    },
  });
  const globalPreviousRows = await prisma.userChallengeProgress.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { lte: globalTrendCutoff },
    },
    select: {
      userId: true,
      challenge: { select: { points: true } },
      user: { select: { name: true, role: true } },
    },
  });

  const globalByUser = new Map<string, RankingEntry>();

  for (const row of globalRows) {
    if (row.user.role !== 'USER') continue;
    const existing =
      globalByUser.get(row.userId) ??
      {
        userId: row.userId,
        name: row.user.name,
        completedChallenges: 0,
        earnedPoints: 0,
        isCurrentUser: row.userId === userId,
      };

    existing.completedChallenges += 1;
    existing.earnedPoints += row.challenge.points;
    globalByUser.set(row.userId, existing);
  }

  const globalSorted = rankEntries([...globalByUser.values()]);

  const globalPreviousByUser = new Map<string, RankingEntry>();
  for (const row of globalPreviousRows) {
    if (row.user.role !== 'USER') continue;
    const existing =
      globalPreviousByUser.get(row.userId) ??
      {
        userId: row.userId,
        name: row.user.name,
        completedChallenges: 0,
        earnedPoints: 0,
        isCurrentUser: row.userId === userId,
      };
    existing.completedChallenges += 1;
    existing.earnedPoints += row.challenge.points;
    globalPreviousByUser.set(row.userId, existing);
  }
  const globalPreviousSorted = rankEntries([...globalPreviousByUser.values()]);

  const globalYourPosition = globalSorted.findIndex((entry) => entry.userId === userId) + 1;
  const globalPreviousPosition =
    globalPreviousSorted.findIndex((entry) => entry.userId === userId) + 1;
  const globalRanking: RankingBlock | null =
    globalYourPosition > 0
      ? {
          boardId: 'global',
          boardTitle: 'Ranking global',
          boardEmoji: '🌍',
          yourPosition: globalYourPosition,
          totalCompetitors: globalSorted.length,
          entries: globalSorted.slice(0, 8),
          trend: getTrend(globalYourPosition, globalPreviousPosition),
        }
      : null;

  const completionBoardId =
    requestedCompletionBoardId && userBoardIds.includes(requestedCompletionBoardId)
      ? requestedCompletionBoardId
      : latestBoardProgress?.boardId ??
          boardsForCompletionOrder[0]?.boardId ??
          null;

  let boardCompletionOrder: BoardCompletionOrderBlock | null = null;
  if (completionBoardId) {
    let meta =
      boardsForCompletionOrder.find((b) => b.boardId === completionBoardId) ??
      (latestBoardProgress && latestBoardProgress.boardId === completionBoardId
        ? {
            boardId: latestBoardProgress.boardId,
            title: latestBoardProgress.boardTitle,
            emoji: latestBoardProgress.boardEmoji,
          }
        : null);
    if (!meta) {
      const row = await prisma.board.findUnique({
        where: { id: completionBoardId },
        select: { id: true, title: true, emoji: true },
      });
      if (row) meta = { boardId: row.id, title: row.title, emoji: row.emoji };
    }
    if (meta) {
      const finishOrder = await getBoardFullCompletionOrder(prisma, completionBoardId);
      boardCompletionOrder = {
        boardId: meta.boardId,
        boardTitle: meta.title,
        boardEmoji: meta.emoji,
        entries: finishOrder.map((row, idx) => ({
          place: idx + 1,
          userId: row.userId,
          name: row.name,
          finishedAt: row.finishedAt.toISOString(),
          isCurrentUser: row.userId === userId,
        })),
      };
    }
  }

  return NextResponse.json({
    stats: {
      activeChallenges: metrics.activeChallenges,
      completedChallenges: metrics.completedChallenges,
      completedBoards: metrics.completedBoards,
      streakDays: metrics.streakDays,
    },
    recentActivity: activities.slice(0, 12),
    boardRanking,
    globalRanking,
    boardsForCompletionOrder,
    completionBoardId,
    boardCompletionOrder,
  });
}

