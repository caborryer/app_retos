'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, ChevronRight } from 'lucide-react';

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  _count: { members: number; boards: number; invites: number };
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/organizations', { credentials: 'include' });
      if (res.ok) setOrgs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setName('');
        await load();
      } else {
        const data = await res.json();
        alert(data.error ?? 'Error al crear empresa');
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-7 h-7 text-primary-400" />
          Empresas
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Crea empresas y gestiona enlaces de invitación para el registro de usuarios.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la empresa"
          className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Crear empresa
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No hay empresas. Crea la primera arriba.</p>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">Usuarios</th>
                <th className="text-left px-4 py-3">Tableros</th>
                <th className="text-left px-4 py-3">Invites</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-white font-medium">{o.name}</td>
                  <td className="px-4 py-3 text-slate-300">{o._count.members}</td>
                  <td className="px-4 py-3 text-slate-300">{o._count.boards}</td>
                  <td className="px-4 py-3 text-slate-300">{o._count.invites}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        o.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'
                      }`}
                    >
                      {o.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/organizations/${o.id}`}
                      className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm"
                    >
                      Gestionar
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
