import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'empresa';
}

export async function GET() {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const orgs = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { members: true, boards: true, invites: true } },
    },
  });

  return NextResponse.json(orgs);
}

export async function POST(req: Request) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const body = await req.json().catch(() => null);
  const name = (body as { name?: string })?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  let slug = slugify(name);
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const org = await prisma.organization.create({
    data: { name, slug },
  });

  return NextResponse.json(org, { status: 201 });
}
