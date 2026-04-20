import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Period = '7d' | '30d' | '90d';

const DAYS_BY_PERIOD: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  RUNNING: { label: 'Running', color: '#FF5327' },
  GYM: { label: 'Gym', color: '#FC0230' },
  SWIMMING: { label: 'Natacion', color: '#06B6D4' },
  CYCLING: { label: 'Ciclismo', color: '#3B82F6' },
  YOGA: { label: 'Yoga', color: '#10B981' },
  PETS: { label: 'Mascotas', color: '#F59E0B' },
  TEAM_SPORTS: { label: 'Team Sports', color: '#8B5CF6' },
  OUTDOOR: { label: 'Outdoor', color: '#84CC16' },
  MIXED: { label: 'Mixto', color: '#64748B' },
};

function toDate(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date;
}

function toPct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '');
}

function mapRegion(lat: number, lon: number) {
  if (lat <= 15 && lat >= -56 && lon <= -30 && lon >= -85) return 'Sudamerica';
  if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) return 'Europa';
  if (lat >= 10 && lat <= 70 && lon >= -170 && lon <= -50) return 'Norteamerica';
  if (lat >= -10 && lat <= 60 && lon >= 40 && lon <= 150) return 'Asia';
  return 'Otras';
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period');
  const period: Period = periodParam === '30d' || periodParam === '90d' ? periodParam : '7d';

  const daysBack = DAYS_BY_PERIOD[period];
  const since = toDate(daysBack);
  const prevSince = toDate(daysBack * 2);

  const [activeUsers, completedChallenges, previousActiveUsers, topUsers, boardStarts, categoryCounts, dailyRows, hourlyRows, heatRows, locationRows] = await Promise.all([
    prisma.userChallengeProgress.findMany({
      where: { startedAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.userChallengeProgress.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: since },
      },
    }),
    prisma.userChallengeProgress.findMany({
      where: { startedAt: { gte: prevSince, lt: since } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { points: 'desc' },
      take: 7,
      select: { id: true, name: true, points: true },
    }),
    prisma.userChallengeProgress.groupBy({
      by: ['challengeId'],
      where: { startedAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { challengeId: 'desc' } },
      take: 20,
    }),
    prisma.userChallengeProgress.groupBy({
      by: ['challengeId'],
      where: { startedAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { challengeId: 'desc' } },
    }),
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>(Prisma.sql`
      SELECT date_trunc('day', "completedAt") AS day, COUNT(*)::bigint AS count
      FROM "UserTaskProgress"
      WHERE "completedAt" IS NOT NULL
        AND "completedAt" >= ${toDate(7)}
      GROUP BY day
      ORDER BY day ASC
    `),
    prisma.$queryRaw<Array<{ hour: number; count: bigint }>>(Prisma.sql`
      SELECT EXTRACT(HOUR FROM "completedAt")::int AS hour, COUNT(*)::bigint AS count
      FROM "UserTaskProgress"
      WHERE "completedAt" IS NOT NULL
        AND "completedAt" >= ${toDate(1)}
      GROUP BY hour
      ORDER BY hour ASC
    `),
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>(Prisma.sql`
      SELECT date_trunc('day', "completedAt") AS day, COUNT(*)::bigint AS count
      FROM "UserTaskProgress"
      WHERE "completedAt" IS NOT NULL
        AND "completedAt" >= ${toDate(84)}
      GROUP BY day
      ORDER BY day ASC
    `),
    prisma.locationPing.findMany({
      where: { createdAt: { gte: since } },
      select: { latitude: true, longitude: true, userId: true },
    }),
  ]);

  const activeUserIds = new Set(activeUsers.map((u) => u.userId));
  const previousUserIds = new Set(previousActiveUsers.map((u) => u.userId));
  const returningUsers = [...activeUserIds].filter((id) => previousUserIds.has(id)).length;
  const retentionRate = previousUserIds.size ? Math.round((returningUsers / previousUserIds.size) * 100) : 0;

  const totalPointsResult = await prisma.user.aggregate({
    _sum: { points: true },
    where: { id: { in: [...activeUserIds] } },
  });

  const challengeIds = [...new Set([...boardStarts.map((b) => b.challengeId), ...categoryCounts.map((c) => c.challengeId)])];
  const challengeRows = challengeIds.length
    ? await prisma.challenge.findMany({
        where: { id: { in: challengeIds } },
        select: {
          id: true,
          category: true,
          board: { select: { id: true, title: true, emoji: true, color: true } },
        },
      })
    : [];

  const challengeMap = new Map(challengeRows.map((c) => [c.id, c]));

  const boardCounter = new Map<string, { id: string; title: string; emoji: string; color: string; participantCount: number }>();
  let totalBoardStarts = 0;
  boardStarts.forEach((row) => {
    const challenge = challengeMap.get(row.challengeId);
    const board = challenge?.board;
    if (!board) return;

    totalBoardStarts += row._count._all;
    const existing = boardCounter.get(board.id);
    if (existing) {
      existing.participantCount += row._count._all;
      return;
    }

    boardCounter.set(board.id, {
      id: board.id,
      title: board.title,
      emoji: board.emoji,
      color: board.color,
      participantCount: row._count._all,
    });
  });

  const topBoards = [...boardCounter.values()]
    .sort((a, b) => b.participantCount - a.participantCount)
    .slice(0, 6)
    .map((board) => ({ ...board, pct: toPct(board.participantCount, totalBoardStarts) }));

  const userFavCategoryRows = await prisma.$queryRaw<Array<{ userId: string; category: string }>>(Prisma.sql`
    WITH category_counts AS (
      SELECT ucp."userId", c."category", COUNT(*)::int AS cnt
      FROM "UserChallengeProgress" ucp
      INNER JOIN "Challenge" c ON c."id" = ucp."challengeId"
      WHERE ucp."status" = 'COMPLETED'
        AND ucp."completedAt" IS NOT NULL
        AND ucp."completedAt" >= ${since}
      GROUP BY ucp."userId", c."category"
    ), ranked AS (
      SELECT "userId", "category", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY cnt DESC) AS rank
      FROM category_counts
    )
    SELECT "userId", "category"
    FROM ranked
    WHERE rank = 1
  `);

  const favCategoryByUser = new Map(userFavCategoryRows.map((r) => [r.userId, r.category]));
  const topUsersWithCategory = topUsers.map((user) => {
    const category = favCategoryByUser.get(user.id) ?? 'MIXED';
    const meta = CATEGORY_META[category] ?? CATEGORY_META.MIXED;
    return {
      name: user.name,
      points: user.points,
      category: meta.label,
      color: meta.color,
    };
  });

  const categoryCounter = new Map<string, number>();
  categoryCounts.forEach((row) => {
    const challenge = challengeMap.get(row.challengeId);
    const key = challenge?.category ?? 'MIXED';
    categoryCounter.set(key, (categoryCounter.get(key) ?? 0) + row._count._all);
  });

  const categoryDistribution = [...categoryCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({
      category: CATEGORY_META[category]?.label ?? category,
      count,
      color: CATEGORY_META[category]?.color ?? '#64748B',
    }));

  const dailyMap = new Map(dailyRows.map((row) => [new Date(row.day).toISOString().slice(0, 10), Number(row.count)]));
  const dailySessions = Array.from({ length: 7 }, (_, index) => {
    const date = toDate(6 - index);
    const key = date.toISOString().slice(0, 10);
    return {
      label: formatWeekday(date),
      count: dailyMap.get(key) ?? 0,
    };
  });

  const hourlyMap = new Map(hourlyRows.map((row) => [Number(row.hour), Number(row.count)]));
  const hourlyActivity = Array.from({ length: 8 }, (_, index) => {
    const hour = index * 3;
    return {
      label: `${String(hour).padStart(2, '0')}h`,
      count: hourlyMap.get(hour) ?? 0,
    };
  });

  const heatByDay = new Map(heatRows.map((row) => [new Date(row.day).toISOString().slice(0, 10), Number(row.count)]));
  const heatmap = Array.from({ length: 84 }, (_, index) => {
    const date = toDate(83 - index);
    return heatByDay.get(date.toISOString().slice(0, 10)) ?? 0;
  });

  const regionCounter = new Map<string, Set<string>>();
  const dotCounter = new Map<string, { latitude: number; longitude: number; count: number }>();

  locationRows.forEach((row) => {
    const region = mapRegion(row.latitude, row.longitude);
    if (!regionCounter.has(region)) regionCounter.set(region, new Set());
    regionCounter.get(region)?.add(row.userId);

    const roundedLat = Number(row.latitude.toFixed(1));
    const roundedLon = Number(row.longitude.toFixed(1));
    const key = `${roundedLat}:${roundedLon}`;
    const existing = dotCounter.get(key);

    if (existing) {
      existing.count += 1;
      return;
    }

    dotCounter.set(key, { latitude: roundedLat, longitude: roundedLon, count: 1 });
  });

  const locationRegions = [...regionCounter.entries()]
    .map(([name, users]) => ({ name, users: users.size }))
    .sort((a, b) => b.users - a.users);

  const locationDots = [...dotCounter.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const startedBoards = totalBoardStarts;
  const completedBoards = await prisma.userChallengeProgress.count({
    where: { status: 'COMPLETED', completedAt: { gte: since } },
  });
  const conversionRate = startedBoards ? Math.round((completedBoards / startedBoards) * 1000) / 10 : 0;

  return NextResponse.json({
    period,
    kpis: {
      activeUsers: activeUserIds.size,
      completedChallenges,
      retentionRate,
      totalPoints: totalPointsResult._sum.points ?? 0,
    },
    topBoards,
    topUsers: topUsersWithCategory,
    dailySessions,
    hourlyActivity,
    categoryDistribution,
    heatmap,
    locationRegions,
    locationDots,
    conversion: {
      startedBoards,
      completedBoards,
      rate: conversionRate,
    },
  });
}
