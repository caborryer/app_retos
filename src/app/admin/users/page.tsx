'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Search, Save } from 'lucide-react';
import { AdminUserCardsSkeleton } from '@/components/admin/AdminSkeleton';

type Org = { id: string; name: string; slug: string };

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizations: Org[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [allOrgs, setAllOrgs] = useState<Org[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
          {users.map((u) => (
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
                </div>
                {u.role !== 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => saveUser(u.id)}
                    disabled={savingId === u.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
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
          ))}
        </div>
      )}
    </div>
  );
}
