import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { purgeEvidenceRows } from '@/lib/evidence-cleanup';

type EvidenceRow = {
  id: string;
  photoUrl: string | null;
  linkUrl: string | null;
};

/**
 * GET /api/cron/evidence-cleanup
 *
 * Rules:
 * 1) Completed board: purge evidence 2 days after full-board completion.
 * 2) Inactive board (not completed): purge evidence after 14 days without updates.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const completedBoardRows = await prisma.$queryRaw<EvidenceRow[]>(Prisma.sql`
      WITH board_totals AS (
        SELECT c."boardId", COUNT(*)::int AS "totalChallenges"
        FROM "Challenge" c
        GROUP BY c."boardId"
      ),
      completed_by_user_board AS (
        SELECT
          c."boardId",
          ucp."userId",
          COUNT(DISTINCT ucp."challengeId")::int AS "completedChallenges",
          MAX(ucp."completedAt") AS "boardFinishedAt"
        FROM "UserChallengeProgress" ucp
        INNER JOIN "Challenge" c ON c."id" = ucp."challengeId"
        WHERE ucp."status" = 'COMPLETED'
          AND ucp."completedAt" IS NOT NULL
        GROUP BY c."boardId", ucp."userId"
      ),
      eligible_completed AS (
        SELECT cub."boardId", cub."userId"
        FROM completed_by_user_board cub
        INNER JOIN board_totals bt ON bt."boardId" = cub."boardId"
        WHERE cub."completedChallenges" >= bt."totalChallenges"
          AND cub."boardFinishedAt" <= NOW() - INTERVAL '2 days'
      )
      SELECT DISTINCT
        utp."id",
        utp."photoUrl",
        utp."linkUrl"
      FROM eligible_completed ec
      INNER JOIN "Challenge" c ON c."boardId" = ec."boardId"
      INNER JOIN "ChallengeTask" ct ON ct."challengeId" = c."id"
      INNER JOIN "UserTaskProgress" utp
        ON utp."taskId" = ct."id"
       AND utp."userId" = ec."userId"
      WHERE utp."photoUrl" IS NOT NULL
         OR utp."linkUrl" IS NOT NULL
    `);

    const inactiveBoardRows = await prisma.$queryRaw<EvidenceRow[]>(Prisma.sql`
      WITH board_totals AS (
        SELECT c."boardId", COUNT(*)::int AS "totalChallenges"
        FROM "Challenge" c
        GROUP BY c."boardId"
      ),
      evidence_last_activity AS (
        SELECT
          c."boardId",
          utp."userId",
          MAX(utp."updatedAt") AS "lastEvidenceAt"
        FROM "UserTaskProgress" utp
        INNER JOIN "ChallengeTask" ct ON ct."id" = utp."taskId"
        INNER JOIN "Challenge" c ON c."id" = ct."challengeId"
        WHERE utp."photoUrl" IS NOT NULL
           OR utp."linkUrl" IS NOT NULL
        GROUP BY c."boardId", utp."userId"
      ),
      completed_by_user_board AS (
        SELECT
          c."boardId",
          ucp."userId",
          COUNT(DISTINCT ucp."challengeId")::int AS "completedChallenges"
        FROM "UserChallengeProgress" ucp
        INNER JOIN "Challenge" c ON c."id" = ucp."challengeId"
        WHERE ucp."status" = 'COMPLETED'
        GROUP BY c."boardId", ucp."userId"
      ),
      eligible_inactive AS (
        SELECT ela."boardId", ela."userId"
        FROM evidence_last_activity ela
        INNER JOIN board_totals bt ON bt."boardId" = ela."boardId"
        LEFT JOIN completed_by_user_board cub
          ON cub."boardId" = ela."boardId"
         AND cub."userId" = ela."userId"
        WHERE ela."lastEvidenceAt" <= NOW() - INTERVAL '14 days'
          AND COALESCE(cub."completedChallenges", 0) < bt."totalChallenges"
      )
      SELECT DISTINCT
        utp."id",
        utp."photoUrl",
        utp."linkUrl"
      FROM eligible_inactive ei
      INNER JOIN "Challenge" c ON c."boardId" = ei."boardId"
      INNER JOIN "ChallengeTask" ct ON ct."challengeId" = c."id"
      INNER JOIN "UserTaskProgress" utp
        ON utp."taskId" = ct."id"
       AND utp."userId" = ei."userId"
      WHERE utp."photoUrl" IS NOT NULL
         OR utp."linkUrl" IS NOT NULL
    `);

    const mergedById = new Map<string, EvidenceRow>();
    for (const row of completedBoardRows) mergedById.set(row.id, row);
    for (const row of inactiveBoardRows) mergedById.set(row.id, row);

    const mergedRows = [...mergedById.values()];
    const cleanup = await purgeEvidenceRows(mergedRows);

    return NextResponse.json({
      ok: true,
      completedRuleMatches: completedBoardRows.length,
      inactiveRuleMatches: inactiveBoardRows.length,
      ...cleanup,
    });
  } catch (error) {
    console.error('[GET /api/cron/evidence-cleanup]', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
