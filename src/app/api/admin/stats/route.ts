import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  boardFilterForOrganization,
  challengeFilterForOrganization,
  getOrganizationIdFromRequest,
  userFilterForOrganizationMembers,
} from '@/lib/admin-org-filter';

// GET /api/admin/stats — dashboard metrics (?organizationId= optional)
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = getOrganizationIdFromRequest(req);
  const boardFilter = boardFilterForOrganization(organizationId);
  const challengeFilter = challengeFilterForOrganization(organizationId);
  const userFilter = userFilterForOrganizationMembers(organizationId);

  const submissionBase = challengeFilter
    ? { task: { challenge: challengeFilter } }
    : {};

  const [
    totalUsers,
    totalSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    totalBoards,
    completedChallenges,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER', ...userFilter } }),
    prisma.userTaskProgress.count({
      where: {
        ...submissionBase,
        OR: [{ photoUrl: { not: null } }, { linkUrl: { not: null } }],
      },
    }),
    prisma.userTaskProgress.count({
      where: { ...submissionBase, validationStatus: 'PENDING' },
    }),
    prisma.userTaskProgress.count({
      where: { ...submissionBase, validationStatus: 'APPROVED' },
    }),
    prisma.userTaskProgress.count({
      where: { ...submissionBase, validationStatus: 'REJECTED' },
    }),
    prisma.board.count({ where: boardFilter }),
    prisma.userChallengeProgress.count({
      where: { status: 'COMPLETED', ...(challengeFilter ? { challenge: challengeFilter } : {}) },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    totalBoards,
    completedChallenges,
  });
}
