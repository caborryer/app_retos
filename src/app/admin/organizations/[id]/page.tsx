'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Link2, Plus, Ban, LayoutGrid, ChevronRight } from 'lucide-react';
import { resolveInviteUrlForDisplay } from '@/lib/app-url';
import { AdminOrgDetailSkeleton } from '@/components/admin/AdminSkeleton';

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

type OrgBoard = {
  id: string;
  title: string;
  emoji: string;
  active: boolean;
  isGeneral: boolean;
  organizationId: string;
  organization?: { id: string; name: string; slug: string };
  _count?: { challenges: number };
};

export default function AdminOrganizationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orgId = params.id;
  const [org, setOrg] = useState<Org | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [boards, setBoards] = useState<OrgBoard[]>([]);
  const [allBoards, setAllBoards] = useState<OrgBoard[]>([]);
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, invRes, boardsRes, allBoardsRes] = await Promise.all([
        fetch(`/api/admin/organizations/${orgId}`, { credentials: 'include' }),
        fetch(`/api/admin/organizations/${orgId}/invites`, { credentials: 'include' }),
        fetch(`/api/boards?organizationId=${encodeURIComponent(orgId)}`, { credentials: 'include' }),
        fetch('/api/boards', { credentials: 'include' }),
      ]);
      if (orgRes.ok) setOrg(await orgRes.json());
      if (invRes.ok) setInvites(await invRes.json());
      if (boardsRes.ok) setBoards(await boardsRes.json());
      if (allBoardsRes.ok) setAllBoards(await allBoardsRes.json());
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const assignableBoards = useMemo(
    () =>
      allBoards
        .filter((b) => b.organizationId !== orgId)
        .sort((a, b) => {
          const aGeneral = a.organization?.slug === 'general' ? 0 : 1;
          const bGeneral = b.organization?.slug === 'general' ? 0 : 1;
          if (aGeneral !== bGeneral) return aGeneral - bGeneral;
          return a.title.localeCompare(b.title, 'es');
        }),
    [allBoards, orgId]
  );

  function toggleBoardSelection(boardId: string) {
    setSelectedBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }

  async function handleAssignExisting() {
    if (selectedBoardIds.size === 0) return;
    const count = selectedBoardIds.size;
    if (
      !confirm(
        `¿Asignar ${count} tablero${count !== 1 ? 's' : ''} a "${org?.name}"? Dejarán de pertenecer a su empresa actual.`
      )
    ) {
      return;
    }
    setAssigning(true);
    try {
      const results = await Promise.all(
        [...selectedBoardIds].map((boardId) =>
          fetch(`/api/boards/${boardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ organizationId: orgId }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        alert(`${failed} tablero(s) no se pudieron asignar.`);
      }
      setSelectedBoardIds(new Set());
      await load();
    } finally {
      setAssigning(false);
    }
  }

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
    const fullUrl = resolveInviteUrlForDisplay(url);
    navigator.clipboard.writeText(fullUrl).then(() => alert('Enlace copiado'));
  }

  if (loading) {
    return <AdminOrgDetailSkeleton />;
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
          Slug: {org.slug} · Los usuarios invitados quedan en esta empresa y ven sus tableros activos.
        </p>
      </div>

      <section className="bg-slate-800/50 border-2 border-primary-500/20 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary-400" />
            Asignar tableros a esta empresa
          </h2>
          <Link
            href={`/admin/boards?organizationId=${encodeURIComponent(orgId)}&new=1`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear tablero para {org.name}
          </Link>
        </div>

        <ol className="text-slate-400 text-sm list-decimal pl-5 space-y-1.5">
          <li>
            <strong className="text-slate-300">Tablero nuevo:</strong> pulsa &quot;Crear tablero para {org.name}&quot;.
          </li>
          <li>
            <strong className="text-slate-300">Tablero existente:</strong> selecciónalo abajo (p. ej. los que están en
            &quot;General&quot;) y pulsa &quot;Asignar seleccionados&quot;.
          </li>
          <li>Si el tablero tiene &quot;Tablero general&quot; activo, lo seguirán viendo todos los usuarios.</li>
        </ol>

        <div className="border-t border-slate-700 pt-4 space-y-3">
          <p className="text-white text-sm font-medium">Asignar tablero existente</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Los tableros creados antes de empresas suelen estar en la empresa &quot;General&quot;. Márcalos aquí para
            moverlos a {org.name} sin recrearlos.
          </p>

          {assignableBoards.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No hay tableros en otras empresas.{' '}
              <Link
                href={`/admin/boards?organizationId=${encodeURIComponent(orgId)}`}
                className="text-primary-400 hover:text-primary-300"
              >
                Ver todos en Tableros
              </Link>
            </p>
          ) : (
            <>
              <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {assignableBoards.map((board) => (
                  <label
                    key={board.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoardIds.has(board.id)}
                      onChange={() => toggleBoardSelection(board.id)}
                      className="rounded shrink-0"
                    />
                    <span className="text-lg shrink-0">{board.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{board.title}</p>
                      <p className="text-slate-500 text-xs">
                        {board._count?.challenges ?? 0} retos ·{' '}
                        {board.active ? 'Activo' : 'Inactivo'}
                        {board.isGeneral ? ' · Tablero general' : ''}
                      </p>
                    </div>
                    <span className="text-slate-400 text-xs shrink-0">
                      {board.organization?.name ?? 'Otra empresa'}
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedBoardIds.size === 0 || assigning}
                onClick={handleAssignExisting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                {assigning ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
                Asignar seleccionados ({selectedBoardIds.size})
              </button>
            </>
          )}
        </div>

        {boards.length === 0 ? (
          <p className="text-slate-500 text-sm border-t border-slate-700 pt-4">
            Esta empresa aún no tiene tableros asignados.
          </p>
        ) : (
          <div className="space-y-2 border-t border-slate-700 pt-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">
              Tableros asignados ({boards.length})
            </p>
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/admin/boards?organizationId=${encodeURIComponent(orgId)}`}
                className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <span className="text-xl shrink-0">{board.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{board.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {board._count?.challenges ?? 0} retos ·{' '}
                    {board.active ? 'Activo' : 'Inactivo'}
                    {board.isGeneral ? ' · General (todos los usuarios)' : ' · Solo esta empresa'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

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
                  <p className="text-slate-500 text-xs mt-1 truncate">
                    {resolveInviteUrlForDisplay(inv.url)}
                  </p>
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
