import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/submissions?status=PENDING&challengeId=xxx&search=xxx
 * Returns all user task submissions with user, task, and challenge info.
 * Admin only.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const challengeId = searchParams.get('challengeId');

  const submissions = await prisma.userTaskProgress.findMany({
    where: {
      ...(status && status !== 'all' ? { validationStatus: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
      ...(challengeId ? { task: { challengeId } } : {}),
      // Only include submissions that have some evidence
      OR: [{ photoUrl: { not: null } }, { linkUrl: { not: null } }],
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      task: {
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              category: true,
              icon: true,
              boardId: true,
              board: { select: { title: true, emoji: true, folder: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(submissions);
}
