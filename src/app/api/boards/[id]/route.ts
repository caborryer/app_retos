import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notifyNewBoard } from '@/lib/notifyNewBoard';
import { getBoardActivationBlockReasons } from '@/lib/board-activation-rules';

// PATCH /api/boards/:id — update a board (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, emoji, color, description, coverImage, active, folder, startDate, endDate } = body;

    // Enforce full board setup + complete challenge data before activation
    if (active === true) {
      const challenges = await prisma.challenge.findMany({
        where: { boardId: params.id },
        include: { tasks: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      });
      const reasons = getBoardActivationBlockReasons(challenges);
      if (reasons.length > 0) {
        return NextResponse.json(
          {
            error: 'No se puede activar el tablero hasta que todos los retos estén completos.',
            reasons,
          },
          { status: 400 }
        );
      }
    }

    // Check previous active state to detect activation
    const previous = await prisma.board.findUnique({
      where: { id: params.id },
      select: { active: true },
    });

    const board = await prisma.board.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(emoji !== undefined && { emoji }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(active !== undefined && { active }),
        ...(folder !== undefined && { folder: folder ?? null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });

    // Notify when a board transitions from inactive to active
    if (active === true && previous?.active === false) {
      notifyNewBoard(board.id, board.title, board.folder).catch(console.error);
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('PATCH /api/boards/[id] failed:', error);
    const message = error instanceof Error ? error.message : 'Error interno al actualizar tablero';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/boards/:id — delete a board (admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.board.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
