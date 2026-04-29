import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TaskInput {
  id?: string;
  title: string;
  description: string;
  photoRequired: boolean;
  linkRequired: boolean;
}

// PATCH /api/admin/challenges/:id — update challenge + sync tasks
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, difficulty, points, icon, color, images, tasks } = body;

  // Update challenge fields
  await prisma.challenge.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(difficulty !== undefined && { difficulty }),
      ...(points !== undefined && { points }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(images !== undefined && { images }),
    },
  });

  // Sync tasks if provided
  if (Array.isArray(tasks)) {
    const incomingIds = (tasks as TaskInput[]).filter((t) => t.id).map((t) => t.id as string);

    // Delete tasks that were removed
    await prisma.challengeTask.deleteMany({
      where: { challengeId: params.id, id: { notIn: incomingIds } },
    });

    // Upsert each task
    for (const t of tasks as TaskInput[]) {
      if (t.id) {
        await prisma.challengeTask.update({
          where: { id: t.id },
          data: {
            title: t.title,
            description: t.description ?? '',
            photoRequired: t.photoRequired ?? false,
            linkRequired: t.linkRequired ?? false,
          },
        });
      } else {
        await prisma.challengeTask.create({
          data: {
            challengeId: params.id,
            title: t.title,
            description: t.description ?? '',
            photoRequired: t.photoRequired ?? false,
            linkRequired: t.linkRequired ?? false,
          },
        });
      }
    }
  }

  const updated = await prisma.challenge.findUnique({
    where: { id: params.id },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/challenges/:id — delete challenge (cascades tasks and user progress)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.challenge.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
