import type { PrismaClient } from '@prisma/client';
import { calculateLevel, getLevelProgress } from '@/lib/utils';

export type ProfileBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

export type ProfileMetrics = {
  points: number;
  level: number;
  levelProgress: number;
  pointsToNextLevel: number;
  activeChallenges: number;
  completedChallenges: number;
  completedBoards: number;
  streakDays: number;
  badges: ProfileBadge[];
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeStreakDays(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map(dayKey));

  const anchor = new Date();
  anchor.setHours(0, 0, 0, 0);

  const todayKey = dayKey(anchor);
  const yesterday = new Date(anchor);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);

  if (!days.has(todayKey) && !days.has(yesterdayKey)) return 0;

  let streak = 0;
  const cursor = new Date(days.has(todayKey) ? anchor : yesterday);
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function ratioProgress(value: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export async function getUserProfileMetrics(
  prisma: PrismaClient,
  userId: string
): Promise<ProfileMetrics> {
  const [challengeProgress, boardStates] = await Promise.all([
    prisma.userChallengeProgress.findMany({
      where: { userId },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
        challenge: { select: { points: true } },
      },
    }),
    prisma.board.findMany({
      select: {
        id: true,
        challenges: {
          select: {
            id: true,
            userProgress: {
              where: { userId, status: 'COMPLETED' },
              select: { id: true },
            },
          },
        },
      },
    }),
  ]);

  const activeChallenges = challengeProgress.filter((p) => p.status === 'IN_PROGRESS').length;
  const completedRows = challengeProgress.filter((p) => p.status === 'COMPLETED');
  const completedChallenges = completedRows.length;
  const points = completedRows.reduce((sum, p) => sum + (p.challenge.points ?? 0), 0);

  const completedBoards = boardStates.filter((board) => {
    if (board.challenges.length === 0) return false;
    return board.challenges.every((c) => c.userProgress.length > 0);
  }).length;

  const streakDates = challengeProgress.flatMap((p) => {
    const out: Date[] = [];
    if (p.startedAt) out.push(p.startedAt);
    if (p.completedAt) out.push(p.completedAt);
    return out;
  });
  const streakDays = computeStreakDays(streakDates);

  const level = calculateLevel(points);
  const levelProgress = getLevelProgress(points);
  const pointsRemainder = points % 200;
  const pointsToNextLevel = pointsRemainder === 0 ? 200 : 200 - pointsRemainder;

  const badges: ProfileBadge[] = [
    {
      id: 'first-completion',
      name: 'Primer Paso',
      description: 'Completa tu primer reto.',
      icon: '🏁',
      unlocked: completedChallenges >= 1,
      progress: ratioProgress(completedChallenges, 1),
      target: 1,
    },
    {
      id: 'consistent-5',
      name: 'Constancia',
      description: 'Completa 5 retos.',
      icon: '💪',
      unlocked: completedChallenges >= 5,
      progress: ratioProgress(completedChallenges, 5),
      target: 5,
    },
    {
      id: 'board-master',
      name: 'Maestro del Tablero',
      description: 'Completa tu primer tablero.',
      icon: '🧩',
      unlocked: completedBoards >= 1,
      progress: ratioProgress(completedBoards, 1),
      target: 1,
    },
    {
      id: 'streak-3',
      name: 'En Racha',
      description: 'Mantén una racha de 3 días.',
      icon: '🔥',
      unlocked: streakDays >= 3,
      progress: ratioProgress(streakDays, 3),
      target: 3,
    },
    {
      id: 'streak-7',
      name: 'Imparable',
      description: 'Mantén una racha de 7 días.',
      icon: '🚀',
      unlocked: streakDays >= 7,
      progress: ratioProgress(streakDays, 7),
      target: 7,
    },
  ];

  return {
    points,
    level,
    levelProgress,
    pointsToNextLevel,
    activeChallenges,
    completedChallenges,
    completedBoards,
    streakDays,
    badges,
  };
}

