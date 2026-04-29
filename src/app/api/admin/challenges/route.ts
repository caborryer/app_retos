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

// GET /api/admin/challenges?boardId=xxx — list challenges for a board (admin, no user progress)
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get('boardId');
  if (!boardId) {
    return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
  }

  const challenges = await prisma.challenge.findMany({
    where: { boardId },
    include: { tasks: { orderBy: { createdAt: 'asc' } }, _count: { select: { userProgress: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(challenges);
}

// POST /api/admin/challenges — create a challenge with tasks
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { boardId, title, description, difficulty, points, icon, color, images, tasks } = body;

  if (!boardId || !title || !difficulty) {
    return NextResponse.json(
      { error: 'boardId, title and difficulty are required' },
      { status: 400 },
    );
  }

  const challenge = await prisma.challenge.create({
    data: {
      boardId,
      title,
      description: description ?? '',
      category: 'MIXED',
      difficulty,
      points: points ?? 0,
      duration: 0,
      icon: icon ?? '🏆',
      color: color ?? '#FC0230',
      images: images ?? [],
      tasks: {
        create: (tasks ?? []).map((t: TaskInput) => ({
          title: t.title,
          description: t.description ?? '',
          photoRequired: t.photoRequired ?? false,
          linkRequired: t.linkRequired ?? false,
        })),
      },
    },
    include: { tasks: true },
  });

  return NextResponse.json(challenge, { status: 201 });
}
