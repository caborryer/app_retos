'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Link2, Plus, Ban } from 'lucide-react';

type Invite = {
  id: string;
  token: string;
  label: string | null;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  url: string;
  createdAt: string;
};

type Org = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export default function AdminOrganizationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orgId = params.id;
  const [org, setOrg] = useState<Org | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, invRes] = await Promise.all([
        fetch(`/api/admin/organizations/${orgId}`, { credentials: 'include' }),
        fetch(`/api/admin/organizations/${orgId}/invites`, { credentials: 'include' }),
      ]);
      if (orgRes.ok) setOrg(await orgRes.json());
      if (invRes.ok) setInvites(await invRes.json());
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          label: label.trim() || null,
          maxUses: maxUses ? parseInt(maxUses, 10) : null,
          expiresAt: expiresAt || null,
        }),
      });
      if (res.ok) {
        setLabel('');
        setMaxUses('');
        setExpiresAt('');
        await load();
      } else {
        const data = await res.json();
        alert(data.error ?? 'Error al crear enlace');
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    if (!confirm('¿Revocar este enlace? Los nuevos registros ya no podrán usarlo.')) return;
    await fetch(`/api/admin/organizations/${orgId}/invites/${inviteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: false }),
    });
    await load();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => alert('Enlace copiado'));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-slate-400">
        Empresa no encontrada.{' '}
        <Link href="/admin/organizations" className="text-primary-400">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Empresas
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{org.name}</h1>
        <p className="text-slate-400 text-sm mt-1">
          Slug: {org.slug} · Los usuarios que se registren con un enlace quedan en esta empresa.
        </p>
      </div>

      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary-400" />
          Enlaces de invitación
        </h2>

        <form onSubmit={handleCreateInvite} className="grid gap-3 sm:grid-cols-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Etiqueta (ej. RRHH marzo)"
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Máx. usos (vacío = ilimitado)"
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="sm:col-span-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Crear enlace
          </button>
        </form>

        {invites.length === 0 ? (
          <p className="text-slate-500 text-sm">Aún no hay enlaces. Crea uno para compartir con la empresa.</p>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    {inv.label || 'Sin etiqueta'}
                    {!inv.active && (
                      <span className="ml-2 text-xs text-red-400">Revocado</span>
                    )}
                  </p>
                  <p className="text-slate-500 text-xs mt-1 truncate">{inv.url}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Usos: {inv.usedCount}
                    {inv.maxUses != null ? ` / ${inv.maxUses}` : ' (ilimitado)'}
                    {inv.expiresAt &&
                      ` · Expira: ${new Date(inv.expiresAt).toLocaleString('es-CO')}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyUrl(inv.url)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs hover:bg-slate-600"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                  {inv.active && (
                    <button
                      type="button"
                      onClick={() => revokeInvite(inv.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Revocar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
