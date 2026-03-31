import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/submissions/:id
// Admin-only: removes one submission record.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.userTaskProgress.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  await prisma.userTaskProgress.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

