'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock3, Link2, Camera, X } from 'lucide-react';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';

interface ChallengeDetailSheetProps {
  challenge: Challenge;
  open: boolean;
  onClose: () => void;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
}

function getChallengeStatusLabel(challenge: Challenge) {
  if (challenge.status === ChallengeStatus.COMPLETED) {
    return { label: 'Completado', className: 'bg-green-100 text-green-700' };
  }
  const latestTask = [...(challenge.tasks ?? [])]
    .reverse()
    .find((task) => task.completed && (task.photoUrl || task.linkUrl));

  if (latestTask?.validationStatus === 'pending') {
    return { label: 'En revision', className: 'bg-amber-100 text-amber-700' };
  }
  if (latestTask?.validationStatus === 'approved') {
    return { label: 'Aprobado', className: 'bg-green-100 text-green-700' };
  }
  if (latestTask?.validationStatus === 'rejected') {
    return { label: 'Rechazado', className: 'bg-red-100 text-red-700' };
  }
  if (challenge.status === ChallengeStatus.IN_PROGRESS) {
    return { label: 'En progreso', className: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Pendiente', className: 'bg-secondary-100 text-secondary-700' };
}

export default function ChallengeDetailSheet({
  challenge,
  open,
  onClose,
  onPrimaryAction,
  primaryLabel = 'Subir evidencia',
  primaryDisabled = false,
}: ChallengeDetailSheetProps) {
  const status = getChallengeStatusLabel(challenge);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]"
            aria-label="Cerrar detalle del reto"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`challenge-detail-title-${challenge.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-[60] left-0 right-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2 w-full sm:max-w-lg"
          >
            <div className="mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-secondary-200 max-h-[82vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 p-4 border-b border-secondary-100">
                <div className="min-w-0">
                  <p className="text-xs text-secondary-500 mb-1">Detalle del reto</p>
                  <h3 id={`challenge-detail-title-${challenge.id}`} className="text-base font-bold text-secondary-900 truncate">
                    {challenge.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="text-[11px] text-secondary-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {challenge.points} pts
                    </span>
                    <span className="text-[11px] text-secondary-500 flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      {challenge.duration} dias
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 p-1.5 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-secondary-700 mb-1">Descripcion</p>
                  <p className="text-sm text-secondary-600 leading-relaxed">
                    {challenge.description?.trim() || 'Sin descripcion disponible.'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-secondary-700 mb-2">Requisitos de evidencia</p>
                  <div className="space-y-2">
                    {(challenge.tasks ?? []).map((task, idx) => (
                      <div key={task.id} className="rounded-xl border border-secondary-200 p-3">
                        <p className="text-xs font-semibold text-secondary-900">
                          {idx + 1}. {task.title}
                        </p>
                        <p className="text-[11px] text-secondary-500 mt-1">
                          {task.description?.trim() || 'Sin descripcion adicional.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                              task.photoRequired ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-500'
                            }`}
                          >
                            <Camera className="w-3 h-3" />
                            {task.photoRequired ? 'Foto requerida' : 'Foto opcional'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                              task.linkRequired ? 'bg-orange-100 text-orange-700' : 'bg-secondary-100 text-secondary-500'
                            }`}
                          >
                            <Link2 className="w-3 h-3" />
                            {task.linkRequired ? 'Link requerido' : 'Link opcional'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-secondary-100 p-4">
                <button
                  type="button"
                  disabled={primaryDisabled || !onPrimaryAction}
                  onClick={onPrimaryAction}
                  className="w-full rounded-xl bg-primary-500 text-white text-sm font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
                >
                  {primaryLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
