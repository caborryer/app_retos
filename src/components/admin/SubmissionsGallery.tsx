'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Challenge, ChallengeTask } from '@/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Link as LinkIcon,
  Image as ImageIcon,
  Search,
  Filter,
  ExternalLink,
  X,
} from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface Submission {
  task: ChallengeTask;
  challenge: Challenge;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <Clock className="w-3 h-3" />
        Pendiente
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3" />
        Aprobado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" />
      Rechazado
    </span>
  );
}

function RejectModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Razón de rechazo</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explica por qué se rechaza este envío..."
          rows={4}
          className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const validateTask = useAppStore((s) => s.validateTask);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { task, challenge } = submission;
  const status = task.validationStatus;

  function handleApprove() {
    validateTask(challenge.id, task.id, 'approved');
  }

  function handleReject(reason: string) {
    validateTask(challenge.id, task.id, 'rejected', reason);
    setShowRejectModal(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden flex flex-col">
        {/* Media preview */}
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {task.photoUrl ? (
            <>
              <img
                src={task.photoUrl}
                alt={task.title}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setLightboxOpen(true)}
              />
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white">
                  <ImageIcon className="w-3 h-3" />
                  Foto
                </span>
              </div>
            </>
          ) : task.linkUrl ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-400" />
              </div>
              <a
                href={task.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors break-all text-center"
              >
                <span className="truncate max-w-[200px]">{task.linkUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          ) : null}

          {/* Status overlay */}
          <div className="absolute top-2 right-2">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{challenge.icon}</span>
              <p className="text-white text-sm font-semibold line-clamp-1">{challenge.title}</p>
            </div>
            <p className="text-slate-400 text-xs line-clamp-1">{task.title}</p>
            {task.completedAt && (
              <p className="text-slate-500 text-xs mt-1">
                {new Date(task.completedAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Rejection reason */}
          {status === 'rejected' && task.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <p className="text-red-400 text-xs">{task.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          {(!status || status === 'pending') && (
            <div className="flex gap-2 mt-auto">
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Aprobar
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium border border-red-500/20 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rechazar
              </button>
            </div>
          )}

          {(status === 'approved' || status === 'rejected') && (
            <button
              onClick={() => validateTask(challenge.id, task.id, 'pending', undefined)}
              className="mt-auto py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 text-xs font-medium transition-all"
            >
              Restablecer a pendiente
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && task.photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img
            src={task.photoUrl}
            alt={task.title}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showRejectModal && (
        <RejectModal onConfirm={handleReject} onCancel={() => setShowRejectModal(false)} />
      )}
    </>
  );
}

export default function SubmissionsGallery() {
  const challenges = useAppStore((s) => s.challenges);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const allSubmissions: Submission[] = challenges.flatMap((c) =>
    c.tasks
      .filter((t) => t.photoUrl || t.linkUrl)
      .map((t) => ({ task: t, challenge: c }))
  );

  const filtered = allSubmissions.filter(({ task, challenge }) => {
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && (!task.validationStatus || task.validationStatus === 'pending')) ||
      task.validationStatus === filterStatus;

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      challenge.title.toLowerCase().includes(q) ||
      task.title.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const counts = {
    all: allSubmissions.length,
    pending: allSubmissions.filter((s) => !s.task.validationStatus || s.task.validationStatus === 'pending').length,
    approved: allSubmissions.filter((s) => s.task.validationStatus === 'approved').length,
    rejected: allSubmissions.filter((s) => s.task.validationStatus === 'rejected').length,
  };

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'pending', label: 'Pendientes', count: counts.pending },
    { key: 'approved', label: 'Aprobados', count: counts.approved },
    { key: 'rejected', label: 'Rechazados', count: counts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por reto o tarea..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl p-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === f.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterStatus === f.key ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No hay envíos</p>
          <p className="text-slate-600 text-sm mt-1">
            {allSubmissions.length === 0
              ? 'Los usuarios aún no han subido fotos o links'
              : 'No hay envíos que coincidan con el filtro'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(({ task, challenge }) => (
            <SubmissionCard
              key={`${challenge.id}-${task.id}`}
              submission={{ task, challenge }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
