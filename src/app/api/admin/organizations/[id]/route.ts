import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { members: true, boards: true, invites: true } },
    },
  });

  if (!org) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(org);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const body = await req.json().catch(() => null);
  const { name, active } = body as { name?: string; active?: boolean };

  const org = await prisma.organization.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(org);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const boards = await prisma.board.count({ where: { organizationId: params.id } });
  if (boards > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: la empresa tiene tableros asociados' },
      { status: 400 }
    );
  }

  await prisma.organization.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
