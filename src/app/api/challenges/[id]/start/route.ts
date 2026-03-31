import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/challenges/:id/start
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const progress = await prisma.userChallengeProgress.upsert({
    where: { userId_challengeId: { userId: session.user.id, challengeId: params.id } },
    update: { status: 'IN_PROGRESS', startedAt: new Date() },
    create: {
      userId: session.user.id,
      challengeId: params.id,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  return NextResponse.json(progress);
}
