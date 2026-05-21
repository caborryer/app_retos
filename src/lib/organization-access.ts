import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type UserRole = 'USER' | 'ADMIN';

export class InviteValidationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_FOUND'
      | 'INACTIVE'
      | 'EXPIRED'
      | 'MAX_USES'
      | 'ORG_INACTIVE'
  ) {
    super(message);
    this.name = 'InviteValidationError';
  }
}

/** ADMIN returns null (no filter). USER returns organization IDs from memberships. */
export async function getUserOrganizationIds(
  userId: string,
  role: UserRole
): Promise<string[] | null> {
  if (role === 'ADMIN') return null;
  const rows = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  return rows.map((r) => r.organizationId);
}

function accessibleBoardOrClause(orgIds: string[]): Prisma.BoardWhereInput {
  if (orgIds.length === 0) return { isGeneral: true };
  return { OR: [{ isGeneral: true }, { organizationId: { in: orgIds } }] };
}

/** Boards the user may access (active only — home list). */
export async function boardWhereForUser(
  userId: string,
  role: UserRole
): Promise<Prisma.BoardWhereInput> {
  if (role === 'ADMIN') return { active: true };

  const orgIds = (await getUserOrganizationIds(userId, role)) ?? [];
  return { active: true, ...accessibleBoardOrClause(orgIds) };
}

/** Boards the user may access (any active state — rankings / activity). */
export async function accessibleBoardWhereForUser(
  userId: string,
  role: UserRole
): Promise<Prisma.BoardWhereInput> {
  if (role === 'ADMIN') return {};

  const orgIds = (await getUserOrganizationIds(userId, role)) ?? [];
  return accessibleBoardOrClause(orgIds);
}

export async function assertUserCanAccessBoard(
  userId: string,
  role: UserRole,
  boardId: string
): Promise<void> {
  if (role === 'ADMIN') return;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { organizationId: true, isGeneral: true, active: true },
  });

  if (!board || !board.active) {
    throw new BoardAccessError('Board not found or inactive');
  }

  if (board.isGeneral) return;

  const orgIds = await getUserOrganizationIds(userId, role);
  if (!orgIds?.includes(board.organizationId)) {
    throw new BoardAccessError('Forbidden');
  }
}

export class BoardAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardAccessError';
  }
}

export async function validateInviteToken(token: string) {
  const trimmed = token?.trim();
  if (!trimmed) {
    throw new InviteValidationError('Enlace inválido', 'NOT_FOUND');
  }

  const invite = await prisma.organizationInvite.findUnique({
    where: { token: trimmed },
    include: { organization: { select: { id: true, name: true, active: true } } },
  });

  if (!invite) {
    throw new InviteValidationError('Enlace inválido o expirado', 'NOT_FOUND');
  }

  if (!invite.active) {
    throw new InviteValidationError('Este enlace fue revocado', 'INACTIVE');
  }

  if (invite.expiresAt && invite.expiresAt <= new Date()) {
    throw new InviteValidationError('Este enlace ha expirado', 'EXPIRED');
  }

  if (invite.maxUses != null && invite.usedCount >= invite.maxUses) {
    throw new InviteValidationError('Este enlace alcanzó el límite de usos', 'MAX_USES');
  }

  if (!invite.organization.active) {
    throw new InviteValidationError('La empresa no está activa', 'ORG_INACTIVE');
  }

  return invite;
}

export function buildInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  return `${base}/register?invite=${encodeURIComponent(token)}`;
}

export function generateInviteToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Challenge filter: only challenges on boards the user can access. */
export async function challengeWhereForUser(
  userId: string,
  role: UserRole
): Promise<Prisma.ChallengeWhereInput> {
  if (role === 'ADMIN') return {};
  const boardWhere = await boardWhereForUser(userId, role);
  return { board: boardWhere };
}

type InviteDb = Pick<typeof prisma, 'organizationInvite' | 'organizationMember'>;

export async function consumeInviteAndCreateMember(
  userId: string,
  inviteToken: string,
  tx: InviteDb = prisma
): Promise<void> {
  const invite = await validateInviteToken(inviteToken);

  const fresh = await tx.organizationInvite.findUnique({
    where: { id: invite.id },
  });
  if (!fresh) throw new InviteValidationError('Enlace inválido', 'NOT_FOUND');
  if (!fresh.active) throw new InviteValidationError('Este enlace fue revocado', 'INACTIVE');
  if (fresh.expiresAt && fresh.expiresAt <= new Date()) {
    throw new InviteValidationError('Este enlace ha expirado', 'EXPIRED');
  }
  if (fresh.maxUses != null && fresh.usedCount >= fresh.maxUses) {
    throw new InviteValidationError('Este enlace alcanzó el límite de usos', 'MAX_USES');
  }

  await tx.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId,
      },
    },
    create: {
      organizationId: invite.organizationId,
      userId,
      inviteId: invite.id,
    },
    update: {},
  });

  await tx.organizationInvite.update({
    where: { id: invite.id },
    data: { usedCount: { increment: 1 } },
  });
}
