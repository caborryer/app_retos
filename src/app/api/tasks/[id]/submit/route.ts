import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/tasks/:id/submit
 * Body: { photoUrl?: string; linkUrl?: string }
 * Marks the task as completed (pending validation) for the authenticated user.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { photoUrl, linkUrl } = body as { photoUrl?: string; linkUrl?: string };

  if (!photoUrl && !linkUrl) {
    return NextResponse.json({ error: 'photoUrl or linkUrl is required' }, { status: 400 });
  }

  // Find the task to get its challenge
  const task = await prisma.challengeTask.findUnique({
    where: { id: params.id },
    include: { challenge: true },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Upsert user task progress
  const taskProgress = await prisma.userTaskProgress.upsert({
    where: { userId_taskId: { userId: session.user.id, taskId: params.id } },
    update: {
      completed: true,
      photoUrl: photoUrl ?? null,
      linkUrl: linkUrl ?? null,
      completedAt: new Date(),
      validationStatus: 'PENDING',
      rejectionReason: null,
    },
    create: {
      userId: session.user.id,
      taskId: params.id,
      completed: true,
      photoUrl: photoUrl ?? null,
      linkUrl: linkUrl ?? null,
      completedAt: new Date(),
      validationStatus: 'PENDING',
    },
  });

  // Ensure the challenge is marked IN_PROGRESS for this user
  await prisma.userChallengeProgress.upsert({
    where: { userId_challengeId: { userId: session.user.id, challengeId: task.challengeId } },
    update: { status: 'IN_PROGRESS' },
    create: {
      userId: session.user.id,
      challengeId: task.challengeId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  return NextResponse.json(taskProgress, { status: 201 });
}
