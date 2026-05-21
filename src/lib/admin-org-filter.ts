import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export function getOrganizationIdFromRequest(req: Request): string | null {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('organizationId');
  return id?.trim() || null;
}

export async function assertBoardBelongsToOrganization(
  boardId: string,
  organizationId: string | null
): Promise<void> {
  if (!organizationId) return;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { organizationId: true },
  });
  if (!board || board.organizationId !== organizationId) {
    throw new Error('BOARD_ORG_MISMATCH');
  }
}

export function boardFilterForOrganization(
  organizationId: string | null
): Prisma.BoardWhereInput | undefined {
  if (!organizationId) return undefined;
  return { organizationId };
}

export function challengeFilterForOrganization(
  organizationId: string | null
): Prisma.ChallengeWhereInput | undefined {
  if (!organizationId) return undefined;
  return { board: { organizationId } };
}

export function userFilterForOrganizationMembers(
  organizationId: string | null
): Prisma.UserWhereInput | undefined {
  if (!organizationId) return undefined;
  return {
    organizationMemberships: { some: { organizationId } },
  };
}
