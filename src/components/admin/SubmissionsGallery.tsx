'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink, Search, Filter, RefreshCw, Trash2 } from 'lucide-react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type ValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Submission {
  id: string;
  userId: string;
  taskId: string;
  completed: boolean;
  photoUrl: string | null;
  linkUrl: string | null;
  completedAt: string | null;
  validationStatus: ValidationStatus;
  rejectionReason: string | null;
  user: { id: string; name: string; email: string; avatar: string | null };
  task: {
    id: string;
    title: string;
    challenge: { id: string; title: string; category: string; icon: string };
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ValidationStatus }) {
  const map: Record<ValidationStatus, { label: string; className: string; Icon: typeof CheckCircle }> = {
    PENDING: { label: 'Pendiente', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', Icon: Clock },
    APPROVED: { label: 'Aprobado', className: 'bg-green-500/10 text-green-400 border-green-500/20', Icon: CheckCircle },
    REJECTED: { label: 'Rechazado', className: 'bg-red-500/10 text-red-400 border-red-500/20', Icon: XCircle },
  };
  const { label, className, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white font-semibold">Motivo de rechazo</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explica por qué se rechaza este envío..."
          rows={3}
          className="w-full bg-slate-700 text-white text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder-slate-400"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-slate-700">
        <h3 className="text-white font-semibold">Eliminar envío</h3>
        <p className="text-slate-300 text-sm">
          ¿Seguro que deseas eliminar este envío? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({
  submission,
  onValidate,
  onDelete,
}: {
  submission: Submission;
  onValidate: (taskId: string, userId: string, status: ValidationStatus, reason?: string) => void;
  onDelete: (submissionId: string) => void;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700"
      >
        {/* Evidence */}
        {submission.photoUrl ? (
          <div className="relative aspect-video bg-slate-900">
            <Image
              src={submission.photoUrl}
              alt="Evidencia"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : submission.linkUrl ? (
          <a
            href={submission.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-5 bg-[#FC4C02]/10 hover:bg-[#FC4C02]/20 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            <span className="text-[#FC4C02] text-sm font-medium truncate">{submission.linkUrl}</span>
            <ExternalLink className="w-4 h-4 text-[#FC4C02] shrink-0 ml-auto" />
          </a>
        ) : null}

        {/* Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white text-sm font-semibold line-clamp-1">
                {submission.task.challenge.icon} {submission.task.challenge.title}
              </p>
              <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{submission.task.title}</p>
            </div>
            <StatusBadge status={submission.validationStatus} />
          </div>

          <div className="flex items-center gap-2">
            {submission.user.avatar ? (
              <Image src={submission.user.avatar} alt="" width={24} height={24} className="rounded-full" unoptimized />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white">
                {submission.user.name[0]}
              </div>
            )}
            <div>
              <p className="text-slate-300 text-xs font-medium">{submission.user.name}</p>
              <p className="text-slate-500 text-[10px]">{submission.user.email}</p>
            </div>
          </div>

          {submission.rejectionReason && (
            <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-2 py-1.5">
              {submission.rejectionReason}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onValidate(submission.taskId, submission.userId, 'APPROVED')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Aprobar
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              <XCircle className="w-3.5 h-3.5" />
              Rechazar
            </button>
            {submission.validationStatus !== 'PENDING' && (
              <button
                onClick={() => onValidate(submission.taskId, submission.userId, 'PENDING')}
                className="px-2.5 py-1.5 rounded-xl bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
                title="Marcar como pendiente"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-700/70 text-red-400 text-xs hover:bg-slate-700 transition-colors border border-slate-600"
              title="Eliminar envío"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {showRejectModal && (
        <RejectModal
          onConfirm={(reason) => {
            onValidate(submission.taskId, submission.userId, 'REJECTED', reason);
            setShowRejectModal(false);
          }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={() => {
            onDelete(submission.id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubmissionsGallery() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [search, setSearch] = useState('');

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter });
      const res = await fetch(`/api/admin/submissions?${params}`);
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleValidate = async (
    taskId: string,
    userId: string,
    status: ValidationStatus,
    rejectionReason?: string
  ) => {
    try {
      await fetch(`/api/tasks/${taskId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, rejectionReason }),
      });
      // Optimistic update
      setSubmissions((prev) =>
        prev.map((s) =>
          s.taskId === taskId && s.userId === userId
            ? { ...s, validationStatus: status, rejectionReason: rejectionReason ?? null }
            : s
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (submissionId: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el envío');
    }
  };

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.user.name.toLowerCase().includes(q) ||
      s.task.challenge.title.toLowerCase().includes(q) ||
      s.task.title.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: submissions.length,
    PENDING: submissions.filter((s) => s.validationStatus === 'PENDING').length,
    APPROVED: submissions.filter((s) => s.validationStatus === 'APPROVED').length,
    REJECTED: submissions.filter((s) => s.validationStatus === 'REJECTED').length,
  };

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: `Todos (${counts.all})` },
    { key: 'PENDING', label: `Pendientes (${counts.PENDING})` },
    { key: 'APPROVED', label: `Aprobados (${counts.APPROVED})` },
    { key: 'REJECTED', label: `Rechazados (${counts.REJECTED})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Envíos</h1>
          <p className="text-slate-400 text-sm mt-1">Revisa y valida las evidencias de los usuarios</p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario o reto..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">📭</p>
          <p>No hay envíos que coincidan con el filtro</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((s) => (
              <SubmissionCard
                key={`${s.taskId}-${s.userId}`}
                submission={s}
                onValidate={handleValidate}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
