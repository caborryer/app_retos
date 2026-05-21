import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const body = await req.json().catch(() => null);
  const organizationIds = (body as { organizationIds?: string[] })?.organizationIds;

  if (!Array.isArray(organizationIds)) {
    return NextResponse.json({ error: 'organizationIds array required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (organizationIds.length > 0) {
    const count = await prisma.organization.count({
      where: { id: { in: organizationIds } },
    });
    if (count !== organizationIds.length) {
      return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.organizationMember.deleteMany({ where: { userId: params.id } }),
    ...(organizationIds.length > 0
      ? [
          prisma.organizationMember.createMany({
            data: organizationIds.map((organizationId) => ({
              organizationId,
              userId: params.id,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: params.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json({
    organizations: memberships.map((m) => m.organization),
  });
}
