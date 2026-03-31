'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Image, LayoutGrid, CheckCircle, Clock, XCircle, Trophy, TrendingUp, Users } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  totalBoards: number;
  completedChallenges: number;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Envíos', value: stats.totalSubmissions, icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        { label: 'Pendientes', value: stats.pendingSubmissions, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        { label: 'Aprobados', value: stats.approvedSubmissions, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Rechazados', value: stats.rejectedSubmissions, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        { label: 'Retos Completos', value: stats.completedChallenges, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        { label: 'Tableros', value: stats.totalBoards, icon: LayoutGrid, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
        { label: 'Usuarios', value: stats.totalUsers, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Bienvenido, {session?.user?.name ?? 'Admin'}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-slate-400 text-xs">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/submissions"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/15 text-primary-400 group-hover:bg-primary-500/25 transition-all shrink-0">
              <Image className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Revisar envíos</h3>
              <p className="text-slate-400 text-sm">
                {stats?.pendingSubmissions ?? '...'} pendientes de validación
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-600 ml-auto group-hover:text-primary-400 transition-colors" />
          </Link>

          <Link
            href="/admin/boards"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/15 text-primary-400 group-hover:bg-primary-500/25 transition-all shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Gestionar tableros</h3>
              <p className="text-slate-400 text-sm">
                {stats?.totalBoards ?? '...'} tableros configurados
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-600 ml-auto group-hover:text-primary-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
