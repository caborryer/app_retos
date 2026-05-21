import { prisma } from '@/lib/prisma';

/**
 * Notifies users when a board becomes active.
 * General boards: all USER accounts.
 * Organization boards: members of that organization only.
 */
export async function notifyNewBoard(boardId: string, boardTitle: string, folder: string | null) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { isGeneral: true, organizationId: true },
  });
  if (!board) return;

  let userIds: string[];

  if (board.isGeneral) {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: board.organizationId },
      select: { userId: true },
    });
    userIds = members.map((m) => m.userId);
  }

  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: '¡Nuevo tablero disponible!',
      message: `El tablero "${boardTitle}" ya está disponible${folder ? ` en la categoría "${folder}"` : ''}. ¡Echa un vistazo!`,
      type: 'info',
      actionUrl: '/home',
    })),
    skipDuplicates: true,
  });
}
