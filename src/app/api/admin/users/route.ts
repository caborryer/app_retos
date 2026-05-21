import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      organizationMemberships: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      organizations: u.organizationMemberships.map((m) => m.organization),
    }))
  );
}
