import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

type AggregatedUser = {
  userId: string;
  name: string;
  completedChallenges: number;
  earnedPoints: number;
};

function aggregateBoardProgress(
  rows: Array<{
    userId: string;
    status: string;
    completedAt: Date | null;
    challenge: { points: number };
    user: { name: string; role: string };
  }>
): AggregatedUser[] {
  const byUser = new Map<string, AggregatedUser>();
  for (const row of rows) {
    if (row.user.role !== 'USER') continue;
    const existing =
      byUser.get(row.userId) ??
      ({
        userId: row.userId,
        name: row.user.name,
        completedChallenges: 0,
        earnedPoints: 0,
      } satisfies AggregatedUser);
    if (row.status === 'COMPLETED') {
      existing.completedChallenges += 1;
      existing.earnedPoints += row.challenge.points;
    }
    byUser.set(row.userId, existing);
  }
  return [...byUser.values()].sort((a, b) => {
    if (b.completedChallenges !== a.completedChallenges) {
      return b.completedChallenges - a.completedChallenges;
    }
    if (b.earnedPoints !== a.earnedPoints) {
      return b.earnedPoints - a.earnedPoints;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function getBoardFullCompletionOrder(
  prisma: PrismaClient,
  boardId: string
): Promise<Array<{ userId: string; name: string; finishedAt: Date }>> {
  const rows = await prisma.$queryRaw<Array<{ userId: string; name: string; finishedAt: Date }>>(
    Prisma.sql`
      SELECT ucp."userId" AS "userId", u."name" AS "name", MAX(ucp."completedAt") AS "finishedAt"
      FROM "UserChallengeProgress" ucp
      INNER JOIN "Challenge" c ON c.id = ucp."challengeId"
      INNER JOIN "User" u ON u.id = ucp."userId"
      WHERE c."boardId" = ${boardId}
        AND ucp.status = 'COMPLETED'
        AND u."role" = 'USER'
        AND ucp."completedAt" IS NOT NULL
      GROUP BY ucp."userId", u."name"
      HAVING COUNT(DISTINCT ucp."challengeId") = (
        SELECT COUNT(*)::int FROM "Challenge" c2 WHERE c2."boardId" = ${boardId}
      )
      ORDER BY MAX(ucp."completedAt") ASC
    `
  );
  return rows;
}

/**
 * Recomputes live leaderboard on a board, persists snapshots, and notifies users
 * when they take or lose 1st place (and when they finish the full board by time).
 */
export async function syncBoardLiveRanksAndNotify(
  prisma: PrismaClient,
  boardId: string,
  triggeringUserId: string
): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, title: true, emoji: true },
  });
  if (!board) return;

  const challengeCount = await prisma.challenge.count({ where: { boardId } });
  if (challengeCount === 0) return;

  const allProgress = await prisma.userChallengeProgress.findMany({
    where: { challenge: { boardId } },
    select: {
      userId: true,
      status: true,
      completedAt: true,
      challenge: { select: { points: true } },
      user: { select: { name: true, role: true } },
    },
  });

  const sorted = aggregateBoardProgress(allProgress);
  const oldSnapshots = await prisma.boardUserRankSnapshot.findMany({ where: { boardId } });
  const oldByUser = new Map(oldSnapshots.map((s) => [s.userId, s]));
  const hasPriorSnapshots = oldSnapshots.length > 0;
  const boardLabel = `${board.emoji} ${board.title}`.trim();

  const notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl: string | null;
  }> = [];

  const leader = sorted[0];
  const triggerEntry = sorted.find((e) => e.userId === triggeringUserId);
  const oldSnap = oldByUser.get(triggeringUserId);
  const oldRank = oldSnap ? oldSnap.rank : null;
  const newRank = triggerEntry ? sorted.findIndex((e) => e.userId === triggeringUserId) + 1 : null;

  if (hasPriorSnapshots && triggerEntry && newRank !== null && oldRank !== null && oldRank !== newRank) {
    if (newRank === 1 && oldRank > 1) {
      notifications.push({
        userId: triggeringUserId,
        title: '¡Lideras el tablero!',
        message: `Pasaste al 1° puesto en «${boardLabel}» por retos completados.`,
        type: 'success',
        actionUrl: '/activity',
      });
    }
    if (oldRank === 1 && newRank > 1 && leader && leader.userId !== triggeringUserId) {
      notifications.push({
        userId: triggeringUserId,
        title: 'Cambio en el liderato',
        message: `${leader.name} te adelantó: ahora vas ${newRank}° en «${boardLabel}».`,
        type: 'warning',
        actionUrl: '/activity',
      });
    }
  }

  const wasFullBefore =
    oldSnap !== undefined && oldSnap.completedChallenges >= challengeCount;
  const isFullNow = triggerEntry !== undefined && triggerEntry.completedChallenges >= challengeCount;

  if (isFullNow && !wasFullBefore && triggerEntry) {
    const finishOrder = await getBoardFullCompletionOrder(prisma, boardId);
    const place = finishOrder.findIndex((e) => e.userId === triggeringUserId) + 1;
    if (place > 0) {
      if (place === 1) {
        notifications.push({
          userId: triggeringUserId,
          title: '¡Primero en terminar!',
          message: `Fuiste el primero en completar todos los retos de «${boardLabel}».`,
          type: 'success',
          actionUrl: '/activity',
        });
      } else if (place === 2) {
        notifications.push({
          userId: triggeringUserId,
          title: 'Segundo en terminar',
          message: `Completaste «${boardLabel}» en 2° lugar (por orden de finalización).`,
          type: 'info',
          actionUrl: '/activity',
        });
      } else {
        notifications.push({
          userId: triggeringUserId,
          title: 'Tablero completado',
          message: `Completaste «${boardLabel}» en el puesto ${place} (por orden de finalización).`,
          type: 'info',
          actionUrl: '/activity',
        });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const keepIds = sorted.map((s) => s.userId);
    if (keepIds.length > 0) {
      await tx.boardUserRankSnapshot.deleteMany({
        where: { boardId, userId: { notIn: keepIds } },
      });
    } else {
      await tx.boardUserRankSnapshot.deleteMany({ where: { boardId } });
    }

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const rank = i + 1;
      await tx.boardUserRankSnapshot.upsert({
        where: {
          boardId_userId: { boardId, userId: entry.userId },
        },
        create: {
          boardId,
          userId: entry.userId,
          rank,
          completedChallenges: entry.completedChallenges,
        },
        update: {
          rank,
          completedChallenges: entry.completedChallenges,
        },
      });
    }

    if (notifications.length > 0) {
      await tx.notification.createMany({ data: notifications });
    }
  });
}
