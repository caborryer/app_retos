import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notifyNewBoard } from '@/lib/notifyNewBoard';
import { boardWhereForUser } from '@/lib/organization-access';
import { BOARD_PRIZE_MAX_LENGTH, normalizeBoardPrize } from '@/lib/board-prize';

// GET /api/boards — admins see all boards; users see active boards for their orgs + general
export async function GET(req: Request) {
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');

  let where: import('@prisma/client').Prisma.BoardWhereInput | undefined;

  if (isAdmin) {
    where = organizationId ? { organizationId } : undefined;
  } else if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } else {
    where = await boardWhereForUser(session.user.id, session.user.role);
  }

  const boards = await prisma.board.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { challenges: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  // Public users prefer fully configured boards (8 challenges). If none match,
  // fall back to active boards so Home never renders empty unexpectedly.
  const visibleBoards = isAdmin
    ? boards
    : (() => {
        const fullyConfigured = boards.filter((b) => (b._count?.challenges ?? 0) >= 8);
        if (fullyConfigured.length > 0) return fullyConfigured;
        return boards;
      })();

  return NextResponse.json(visibleBoards);
}

// POST /api/boards — create a new board (admin only)
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    emoji,
    color,
    description,
    coverImage,
    active,
    folder,
    startDate,
    endDate,
    organizationId,
    isGeneral,
    prize,
  } = body;

  if (!title || !emoji || !color) {
    return NextResponse.json({ error: 'title, emoji and color are required' }, { status: 400 });
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
  }

  if (active === true) {
    return NextResponse.json(
      { error: 'No puedes activar un tablero al crearlo. Primero carga los 8 retos.' },
      { status: 400 }
    );
  }

  if (prize !== undefined && prize !== null && typeof prize === 'string' && prize.trim().length > BOARD_PRIZE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `El premio no puede superar ${BOARD_PRIZE_MAX_LENGTH} caracteres` },
      { status: 400 }
    );
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
      organizationId,
      isGeneral: Boolean(isGeneral),
      prize: normalizeBoardPrize(prize),
    },
  });

  // Notify users when a board is created already active
  if (board.active) {
    notifyNewBoard(board.id, board.title, board.folder).catch(console.error);
  }

  return NextResponse.json(board, { status: 201 });
}
