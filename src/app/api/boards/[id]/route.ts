import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/boards/:id — update a board (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, emoji, color, description, coverImage, active } = body;

  const board = await prisma.board.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(emoji !== undefined && { emoji }),
      ...(color !== undefined && { color }),
      ...(description !== undefined && { description }),
      ...(coverImage !== undefined && { coverImage }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(board);
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
