'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Search, Save, Trash2, X } from 'lucide-react';
import { AdminUserCardsSkeleton } from '@/components/admin/AdminSkeleton';
import { USER_DELETE_CONFIRM_TEXT } from '@/lib/delete-user';

type Org = { id: string; name: string; slug: string };

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizations: Org[];
};

function DeleteUserModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canConfirm = confirmText.trim() === USER_DELETE_CONFIRM_TEXT;

  async function handleDelete() {
    if (!canConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmText: confirmText.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(typeof body.error === 'string' ? body.error : 'Error al eliminar el usuario');
        return;
      }
      onDeleted();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-700"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="delete-user-title" className="text-white font-semibold text-lg">
            Eliminar usuario
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed">
          Esta acción es irreversible. Se borrarán el progreso en retos, envíos de evidencia,
          membresías y demás datos asociados a esta cuenta.
        </p>

        <div className="rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 space-y-1">
          <p className="text-white font-medium">{user.name}</p>
          <p className="text-slate-400 text-sm">{user.email}</p>
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1.5">
            Escribe <span className="font-mono text-red-400">{USER_DELETE_CONFIRM_TEXT}</span> para
            confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={USER_DELETE_CONFIRM_TEXT}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            autoComplete="off"
            disabled={deleting}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-sm hover:bg-slate-600 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canConfirm || deleting}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Eliminando...' : 'Eliminar usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [allOrgs, setAllOrgs] = useState<Org[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);

  const loadUsers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const res = await fetch(`/api/admin/users${params}`, { credentials: 'include' });
      if (res.ok) {
        const data: UserRow[] = await res.json();
        setUsers(data);
        const nextDraft: Record<string, string[]> = {};
        for (const u of data) {
          nextDraft[u.id] = u.organizations.map((o) => o.id);
        }
        setDraft(nextDraft);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/organizations', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllOrgs);
    loadUsers();
  }, [loadUsers]);

  function toggleOrg(userId: string, orgId: string) {
    setDraft((prev) => {
      const current = prev[userId] ?? [];
      const has = current.includes(orgId);
      return {
        ...prev,
        [userId]: has ? current.filter((id) => id !== orgId) : [...current, orgId],
      };
    });
  }

  async function saveUser(userId: string) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/organizations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationIds: draft[userId] ?? [] }),
      });
      if (res.ok) await loadUsers(query);
      else {
        const data = await res.json();
        alert(data.error ?? 'Error al guardar');
      }
    } finally {
      setSavingId(null);
    }
  }

  function handleUserDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDraft((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-400" />
          Usuarios
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Asigna empresas manualmente (usuarios legacy o excepciones sin enlace de invitación).
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadUsers(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="w-full pl-10 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm hover:bg-slate-600"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <AdminUserCardsSkeleton />
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No hay usuarios.</p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const isSelf = currentUserId === u.id;
            const canDelete = u.role !== 'ADMIN' && !isSelf;

            return (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-medium">{u.name}</p>
                    <p className="text-slate-400 text-sm">{u.email}</p>
                    {u.role === 'ADMIN' && (
                      <span className="text-xs text-amber-400">Administrador global</span>
                    )}
                    {isSelf && u.role !== 'ADMIN' && (
                      <span className="text-xs text-slate-500 block mt-0.5">Tu cuenta</span>
                    )}
                  </div>
                  {u.role !== 'ADMIN' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveUser(u.id)}
                        disabled={savingId === u.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Guardar
                      </button>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          disabled={savingId === u.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-semibold hover:bg-red-600/20 hover:text-red-400 border border-slate-600 hover:border-red-500/30 disabled:opacity-50"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      ) : isSelf ? (
                        <span
                          className="text-[10px] text-slate-500 self-center px-1"
                          title="Usa ajustes de cuenta para eliminar tu propio usuario"
                        >
                          No puedes eliminarte aquí
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
                {u.role !== 'ADMIN' && (
                  <div className="flex flex-wrap gap-2">
                    {allOrgs.map((o) => {
                      const checked = (draft[u.id] ?? []).includes(o.id);
                      return (
                        <label
                          key={o.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${
                            checked
                              ? 'border-primary-500/50 bg-primary-500/15 text-primary-300'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOrg(u.id, o.id)}
                            className="rounded"
                          />
                          {o.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onDeleted={() => handleUserDeleted(userToDelete.id)}
        />
      )}
    </div>
  );
}
