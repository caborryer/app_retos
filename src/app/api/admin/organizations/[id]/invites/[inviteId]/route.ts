import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { buildInviteUrl, getRequestPublicOrigin } from '@/lib/app-url';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; inviteId: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const body = await req.json().catch(() => ({}));
  const { label, active, expiresAt, maxUses } = body as {
    label?: string | null;
    active?: boolean;
    expiresAt?: string | null;
    maxUses?: number | null;
  };

  const invite = await prisma.organizationInvite.update({
    where: { id: params.inviteId, organizationId: params.id },
    data: {
      ...(label !== undefined && { label: label?.trim() || null }),
      ...(active !== undefined && { active }),
      ...(expiresAt !== undefined && {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }),
      ...(maxUses !== undefined && {
        maxUses: maxUses != null && maxUses > 0 ? maxUses : null,
      }),
    },
  });

  return NextResponse.json({
    ...invite,
    url: buildInviteUrl(invite.token, getRequestPublicOrigin(req)),
  });
}
