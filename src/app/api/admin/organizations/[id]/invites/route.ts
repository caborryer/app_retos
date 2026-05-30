import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { generateInviteToken } from '@/lib/organization-access';
import { buildInviteUrl, getRequestPublicOrigin } from '@/lib/app-url';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const origin = getRequestPublicOrigin(req);
  const invites = await prisma.organizationInvite.findMany({
    where: { organizationId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    invites.map((inv) => ({
      ...inv,
      url: buildInviteUrl(inv.token, origin),
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const org = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { label, expiresAt, maxUses } = body as {
    label?: string;
    expiresAt?: string | null;
    maxUses?: number | null;
  };

  let token = generateInviteToken();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.organizationInvite.findUnique({ where: { token } });
    if (!clash) break;
    token = generateInviteToken();
  }

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: params.id,
      token,
      label: label?.trim() || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUses: maxUses != null && maxUses > 0 ? maxUses : null,
      createdById: authResult.session.user.id,
    },
  });

  return NextResponse.json(
    { ...invite, url: buildInviteUrl(invite.token, getRequestPublicOrigin(req)) },
    { status: 201 }
  );
}
