'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, FolderOpen, X } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media-url';
import { formatBoardCalendarDate } from '@/lib/board-date';

interface BoardDetail {
  id: string;
  title: string;
  emoji: string;
  color: string;
  coverImage: string | null;
  folder: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  prize?: string | null;
}

interface BoardDetailSheetProps {
  board: BoardDetail | null;
  open: boolean;
  onClose: () => void;
  statusLabel: 'Nuevo' | 'En curso' | 'Completado';
  completedChallenges: number;
  totalChallenges: number;
}

function formatDate(value: string | null | undefined) {
  return formatBoardCalendarDate(value, 'es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BoardDetailSheet({
  board,
  open,
  onClose,
  statusLabel,
  completedChallenges,
  totalChallenges,
}: BoardDetailSheetProps) {
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

  if (!board) return null;

  const start = formatDate(board.startDate);
  const end = formatDate(board.endDate);
  const coverSrc = resolveMediaUrl(board.coverImage);
  const progress = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;
  const statusClass =
    statusLabel === 'Completado'
      ? 'bg-green-500/15 text-green-400'
      : statusLabel === 'En curso'
        ? 'bg-blue-500/15 text-blue-400'
        : 'bg-primary-500/15 text-primary-400';

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
            aria-label="Cerrar detalle del tablero"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`board-detail-title-${board.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-[60] left-0 right-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2 w-full sm:max-w-lg"
          >
            <div className="mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-slate-900 shadow-2xl border border-slate-700 max-h-[82vh] overflow-y-auto">
              <div className="relative h-32 sm:h-36 border-b border-slate-800 overflow-hidden">
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={board.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${board.color} 0%, ${board.color}BB 100%)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-white bg-black/30 hover:bg-black/45 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute left-4 right-4 bottom-3">
                  <p className="text-xs text-slate-300/90 mb-1">Detalle del tablero</p>
                  <h3 id={`board-detail-title-${board.id}`} className="text-lg font-bold text-white truncate">
                    {board.emoji} {board.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${statusClass}`}>
                    {statusLabel}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {completedChallenges} / {totalChallenges} retos completados
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1">Descripción</p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {board.description?.trim() || 'El organizador no añadió una descripción.'}
                  </p>
                </div>

                {board.prize?.trim() && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
                    <p className="text-xs font-semibold text-amber-400 mb-1">Premio al completar</p>
                    <p className="text-sm text-slate-200 leading-snug">{board.prize.trim()}</p>
                  </div>
                )}

                {(board.folder || start || end) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Información del tablero</p>
                    <div className="flex flex-wrap gap-2">
                      {board.folder && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-slate-800 text-slate-300">
                          <FolderOpen className="w-3 h-3" />
                          {board.folder}
                        </span>
                      )}
                      {(start || end) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-slate-800 text-slate-300">
                          <CalendarDays className="w-3 h-3" />
                          {start && end ? `${start} - ${end}` : start ?? end}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1">Progreso actual</p>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{progress}% completado</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
