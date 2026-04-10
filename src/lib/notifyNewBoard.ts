import { prisma } from '@/lib/prisma';

/**
 * Creates in-app notifications for all relevant users when a board becomes active.
 *
 * If the board has a folder: notifies users who have progress in challenges
 * belonging to any board with the same folder (i.e., same category).
 *
 * If no folder: notifies all non-admin users.
 */
export async function notifyNewBoard(boardId: string, boardTitle: string, folder: string | null) {
  let userIds: string[];

  if (folder) {
    // Find users who have interacted with any challenge in the same folder
    const rows = await prisma.userChallengeProgress.findMany({
      where: {
        challenge: {
          board: { folder },
          boardId: { not: boardId }, // exclude the new board itself to avoid self-match
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    userIds = rows.map((r) => r.userId);
  } else {
    // No folder — notify all regular users
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
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
