import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';
import { getStorageObjectPathFromPublicUrl } from '@/lib/evidence-cleanup';

export const USER_DELETE_CONFIRM_TEXT = 'ELIMINAR';

export class UserDeleteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'UserDeleteError';
    this.statusCode = statusCode;
  }
}

async function removeAvatarFromStorage(avatarUrl: string | null) {
  const path = getStorageObjectPathFromPublicUrl(avatarUrl);
  if (!path) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.error('[delete-user] avatar storage remove failed', error);
  }
}

export async function deleteUserCompletely(
  targetUserId: string,
  options: { actorUserId?: string } = {}
) {
  const isAdminAction = Boolean(options.actorUserId);

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, avatar: true },
  });

  if (!user) {
    throw new UserDeleteError('Usuario no encontrado', 404);
  }

  if (isAdminAction) {
    if (targetUserId === options.actorUserId) {
      throw new UserDeleteError(
        'No puedes eliminar tu propia cuenta desde aquí',
        403
      );
    }

    if (user.role === 'ADMIN') {
      throw new UserDeleteError('No se puede eliminar un administrador', 403);
    }
  }

  await removeAvatarFromStorage(user.avatar);

  await prisma.$transaction(async (tx) => {
    await tx.boardUserRankSnapshot.deleteMany({ where: { userId: targetUserId } });
    await tx.user.delete({ where: { id: targetUserId } });
  });

  return { ok: true as const };
}

export function assertUserDeleteConfirmation(confirmText: unknown) {
  const normalized =
    typeof confirmText === 'string' ? confirmText.trim() : '';
  if (normalized !== USER_DELETE_CONFIRM_TEXT) {
    throw new UserDeleteError(
      'Confirmación inválida. Escribe ELIMINAR para continuar.',
      400
    );
  }
}
