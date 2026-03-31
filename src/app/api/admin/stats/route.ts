import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/stats — dashboard metrics
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    totalUsers,
    totalSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    totalBoards,
    completedChallenges,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.userTaskProgress.count({
      where: { OR: [{ photoUrl: { not: null } }, { linkUrl: { not: null } }] },
    }),
    prisma.userTaskProgress.count({ where: { validationStatus: 'PENDING' } }),
    prisma.userTaskProgress.count({ where: { validationStatus: 'APPROVED' } }),
    prisma.userTaskProgress.count({ where: { validationStatus: 'REJECTED' } }),
    prisma.board.count(),
    prisma.userChallengeProgress.count({ where: { status: 'COMPLETED' } }),
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
