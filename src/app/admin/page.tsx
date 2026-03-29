'use client';

import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { Image, LayoutGrid, CheckCircle, Clock, XCircle, Trophy, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const challenges = useAppStore((s) => s.challenges);
  const boards = useAppStore((s) => s.boards);
  const currentUser = useAppStore((s) => s.currentUser);

  // Collect all tasks that have a photo or link (submissions)
  const allSubmissions = challenges.flatMap((c) =>
    c.tasks
      .filter((t) => t.photoUrl || t.linkUrl)
      .map((t) => ({ task: t, challenge: c }))
  );

  const pending = allSubmissions.filter((s) => !s.task.validationStatus || s.task.validationStatus === 'pending');
  const approved = allSubmissions.filter((s) => s.task.validationStatus === 'approved');
  const rejected = allSubmissions.filter((s) => s.task.validationStatus === 'rejected');

  const completedChallenges = challenges.filter((c) => c.status === 'completed');
  const inProgressChallenges = challenges.filter((c) => c.status === 'in_progress');

  const stats = [
    {
      label: 'Total Envíos',
      value: allSubmissions.length,
      icon: Image,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Pendientes',
      value: pending.length,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Aprobados',
      value: approved.length,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Rechazados',
      value: rejected.length,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
  ];

  const challengeStats = [
    { label: 'Total Retos', value: challenges.length, icon: Trophy, color: 'text-primary-400' },
    { label: 'En Progreso', value: inProgressChallenges.length, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Completados', value: completedChallenges.length, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Tableros Activos', value: boards.length, icon: LayoutGrid, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hola, {currentUser?.name} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Aquí tienes un resumen del estado actual de la plataforma.
        </p>
      </div>

      {/* Submissions stats */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Envíos de usuarios
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border p-5 ${stat.bg} flex items-center gap-4`}
              >
                <div className={`shrink-0 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Challenge stats */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Estado de retos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {challengeStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 flex items-center gap-4"
              >
                <div className={`shrink-0 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/submissions"
            className="group flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-primary-500/40 p-5 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/15 text-primary-400 group-hover:bg-primary-500/25 transition-all shrink-0">
              <Image className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Revisar envíos</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {pending.length > 0
                  ? `${pending.length} envío${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''} de revisión`
                  : 'No hay envíos pendientes'}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/boards"
            className="group flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-purple-500/40 p-5 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25 transition-all shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Gestionar tableros</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {boards.length} tablero{boards.length !== 1 ? 's' : ''} configurado{boards.length !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent pending submissions */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Últimos envíos pendientes
            </h2>
            <Link href="/admin/submissions" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pending.slice(0, 5).map(({ task, challenge }) => (
              <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
                {task.photoUrl ? (
                  <div className="aspect-square relative">
                    <img
                      src={task.photoUrl}
                      alt={task.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <p className="text-white text-[10px] font-medium leading-tight line-clamp-2">
                        {challenge.title}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center gap-1 p-2">
                    <span className="text-2xl">{challenge.icon}</span>
                    <p className="text-slate-400 text-[10px] text-center line-clamp-2">
                      {challenge.title}
                    </p>
                  </div>
                )}
                <div className="px-2 py-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
                    <Clock className="w-3 h-3" />
                    Pendiente
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
