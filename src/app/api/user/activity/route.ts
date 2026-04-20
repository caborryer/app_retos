import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserProfileMetrics } from '@/lib/profile-metrics';

export const dynamic = 'force-dynamic';

type ActivityItem = {
  id: string;
  type: 'start' | 'complete' | 'submission';
  title: string;
  icon: string;
  color: string;
  time: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

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

  return NextResponse.json({
    stats: {
      activeChallenges: metrics.activeChallenges,
      completedChallenges: metrics.completedChallenges,
      completedBoards: metrics.completedBoards,
      streakDays: metrics.streakDays,
    },
    recentActivity: activities.slice(0, 12),
  });
}

