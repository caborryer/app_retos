import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/boards — list all boards with challenge count
export async function GET() {
  const boards = await prisma.board.findMany({
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
  const { title, emoji, color, description, coverImage, active } = body;

  if (!title || !emoji || !color) {
    return NextResponse.json({ error: 'title, emoji and color are required' }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: { title, emoji, color, description, coverImage, active: active ?? false },
  });

  return NextResponse.json(board, { status: 201 });
}
