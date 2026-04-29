import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/tasks/:id/validate
 * Body: { userId: string; status: 'APPROVED' | 'REJECTED' | 'PENDING'; rejectionReason?: string }
 * Admin only.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, status, rejectionReason } = body as {
    userId: string;
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
    rejectionReason?: string;
  };

  if (!userId || !status) {
    return NextResponse.json({ error: 'userId and status are required' }, { status: 400 });
  }

  const taskProgress = await prisma.userTaskProgress.update({
    where: { userId_taskId: { userId, taskId: params.id } },
    data: {
      validationStatus: status,
      rejectionReason: status === 'REJECTED' ? (rejectionReason ?? null) : null,
      validatedById: session.user.id,
      validatedAt: new Date(),
    },
  });

  // Fetch task info once — needed for both APPROVED logic and notifications
  const task = await prisma.challengeTask.findUnique({
    where: { id: params.id },
    include: { challenge: true },
  });

  // If approved, mark the whole challenge as completed for bingo flow.
  // A single validated evidence should unlock the card.
  if (status === 'APPROVED' && task) {
    const previousProgress = await prisma.userChallengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId: task.challengeId } },
    });

    await prisma.userChallengeProgress.upsert({
      where: { userId_challengeId: { userId, challengeId: task.challengeId } },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      create: {
        userId,
        challengeId: task.challengeId,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Award points only the first time this challenge becomes completed.
    const wasAlreadyCompleted = previousProgress?.status === 'COMPLETED';
    if (!wasAlreadyCompleted) {
      await (prisma.user.update as Function)({
        where: { id: userId },
        data: {
          points: { increment: task.challenge.points },
          completedChallenges: { increment: 1 },
        },
      });
    }
  }

  // Send in-app notification for APPROVED and REJECTED (not PENDING)
  if ((status === 'APPROVED' || status === 'REJECTED') && task) {
    await prisma.notification.create({
      data: {
        userId,
        title: status === 'APPROVED' ? '¡Evidencia aprobada!' : 'Evidencia rechazada',
        message:
          status === 'APPROVED'
            ? `Tu evidencia para "${task.title}" en el reto "${task.challenge.title}" fue aprobada. ¡Reto completado!`
            : `Tu evidencia para "${task.title}" fue rechazada.${rejectionReason ? ` Motivo: ${rejectionReason}` : ''}`,
        type: status === 'APPROVED' ? 'success' : 'warning',
        actionUrl: '/home',
      },
    });
  }

  // UX fix:
  // After a rejection notification, clear the submission automatically so
  // the user can re-submit immediately without waiting for admin deletion.
  if (status === 'REJECTED') {
    await prisma.userTaskProgress.delete({
      where: { id: taskProgress.id },
    });

    return NextResponse.json({
      ...taskProgress,
      completed: false,
      photoUrl: null,
      linkUrl: null,
      completedAt: null,
      validationStatus: 'PENDING',
      rejectionReason: null,
      deletedAfterReject: true,
    });
  }

  return NextResponse.json(taskProgress);
}
