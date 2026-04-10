import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notifyNewBoard } from '@/lib/notifyNewBoard';

// GET /api/boards — admins see all boards; regular users see only active ones
export async function GET() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  const boards = await prisma.board.findMany({
    where: isAdmin ? undefined : { active: true },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { challenges: true } } },
  });
  return NextResponse.json(boards);
}

// POST /api/boards — create a new board (admin only)
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, emoji, color, description, coverImage, active, folder, startDate, endDate } = body;

  if (!title || !emoji || !color) {
    return NextResponse.json({ error: 'title, emoji and color are required' }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: {
      title,
      emoji,
      color,
      description,
      coverImage,
      active: active ?? false,
      folder: folder ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  // Notify users when a board is created already active
  if (board.active) {
    notifyNewBoard(board.id, board.title, board.folder).catch(console.error);
  }

  return NextResponse.json(board, { status: 201 });
}
