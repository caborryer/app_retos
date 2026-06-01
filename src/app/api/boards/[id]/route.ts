import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notifyNewBoard } from '@/lib/notifyNewBoard';
import { getBoardActivationBlockReasons } from '@/lib/board-activation-rules';
import { BoardDeleteError, deleteBoardCompletely } from '@/lib/delete-board';
import { BOARD_PRIZE_MAX_LENGTH, normalizeBoardPrize } from '@/lib/board-prize';

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

    if (prize !== undefined && prize !== null && typeof prize === 'string' && prize.trim().length > BOARD_PRIZE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `El premio no puede superar ${BOARD_PRIZE_MAX_LENGTH} caracteres` },
        { status: 400 }
      );
    }

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

    if (organizationId !== undefined) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
      }
    }

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
        ...(organizationId !== undefined && { organizationId }),
        ...(isGeneral !== undefined && { isGeneral: Boolean(isGeneral) }),
        ...(prize !== undefined && { prize: normalizeBoardPrize(prize) }),
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { challenges: true } },
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

// DELETE /api/boards/:id — delete board and all related data (admin only, inactive boards)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await deleteBoardCompletely(params.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BoardDeleteError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('DELETE /api/boards/[id] failed:', error);
    return NextResponse.json({ error: 'Error al eliminar el tablero' }, { status: 500 });
  }
}
