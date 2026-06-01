import { NextResponse } from 'next/server';
import {
  assertUserDeleteConfirmation,
  deleteUserCompletely,
  UserDeleteError,
} from '@/lib/delete-user';
import { requireAdmin } from '@/lib/admin-auth';

type DeleteBody = {
  confirmText?: unknown;
};

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin();
  if ('error' in authResult) return authResult.error;

  const body = (await req.json().catch(() => ({}))) as DeleteBody;

  try {
    assertUserDeleteConfirmation(body.confirmText);
    await deleteUserCompletely(params.id, {
      actorUserId: authResult.session.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UserDeleteError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('DELETE /api/admin/users/[id] failed:', error);
    return NextResponse.json({ error: 'Error al eliminar el usuario' }, { status: 500 });
  }
}
