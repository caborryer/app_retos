'use client';

import { useRef, useState } from 'react';
import { Camera, CheckCircle, X } from 'lucide-react';
import { userFacingApiError } from '@/lib/user-facing-api-error';
import { normalizeEvidenceLink } from '@/lib/normalize-evidence-link';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ChallengeFlipCardProps {
  challenge: Challenge;
  className?: string;
}

export default function ChallengeFlipCard({ challenge, className }: ChallengeFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateChallenge } = useAppStore();

  // Helper: call API to submit evidence for the first uncompleted task
  const submitEvidence = async (photoFile?: File, linkUrl?: string) => {
    setSubmitting(true);
    const firstTask = challenge.tasks?.find((t) => !t.completed);
    if (!firstTask) {
      setSubmitting(false);
      return;
    }

    // If photo, upload it first
    let photoUrl: string | undefined;
    if (photoFile) {
      const fd = new FormData();
      fd.append('file', photoFile);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        setSubmitting(false);
        alert(await userFacingApiError(res, 'upload'));
        return;
      }
      const { url } = await res.json();
      photoUrl = url;
    }

    const submitRes = await fetch(`/api/tasks/${firstTask.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photoUrl, linkUrl }),
    });
    if (!submitRes.ok) {
      setSubmitting(false);
      alert(await userFacingApiError(submitRes, 'submit'));
      return;
    }

    // Optimistic local update
    updateChallenge(challenge.id, {
      status: 'in_progress' as never,
      tasks: challenge.tasks.map((t) =>
        t.id === firstTask.id
          ? { ...t, completed: true, photoUrl: photoUrl ?? t.photoUrl, linkUrl: linkUrl ?? t.linkUrl, validationStatus: 'pending' as never }
          : t
      ),
    });
    setSubmitting(false);
    alert('Evidencia enviada. Estado: En revision por el admin.');
  };

  const imageUrl = challenge.images?.[0] ?? null;
  const isCompleted = challenge.status === ChallengeStatus.COMPLETED;
  const hasPhotoTask = challenge.tasks?.some((t) => !t.completed && t.photoRequired) ?? false;
  const hasLinkTask = challenge.tasks?.some((t) => !t.completed && !!t.linkRequired) ?? false;
  const hasNoTasks = !challenge.tasks || challenge.tasks.length === 0;
  const latestEvidenceTask = [...challenge.tasks]
    .reverse()
    .find((t) => t.completed && (t.photoUrl || t.linkUrl));
  const latestStatus = latestEvidenceTask?.validationStatus;

  const handleCardInteraction = () => {
    if (isCompleted) return;
    if (!showLinkInput) setIsFlipped((prev) => !prev);
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleCompleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await submitEvidence();
    setIsFlipped(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Formato no válido. Usa JPG, PNG, GIF o WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('La imagen no debe superar 5MB.');
      return;
    }
    submitEvidence(file).then(() => setIsFlipped(false));
    e.target.value = '';
  };

  const handleLinkSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = linkValue.trim();
    if (!trimmed) {
      setLinkError('Ingresa un link válido');
      return;
    }
    const normalized = normalizeEvidenceLink(trimmed);
    if (!normalized) {
      setLinkError('El link no es válido. Usa una URL completa (ej. Strava).');
      return;
    }
    await submitEvidence(undefined, normalized);
    setLinkValue('');
    setLinkError('');
    setShowLinkInput(false);
    setIsFlipped(false);
  };

  return (
    <div
      className={cn('group/card w-full aspect-square', className)}
      onMouseEnter={() => { if (!isCompleted && !showLinkInput) setIsFlipped(true); }}
      onMouseLeave={() => { if (!showLinkInput) setIsFlipped(false); }}
    >
      <button
        type="button"
        className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        style={{ perspective: 1000, borderRadius: 16 }}
        onClick={handleCardInteraction}
        aria-label={isFlipped ? 'Volver a la imagen del reto' : 'Ver opciones del reto'}
      >
        <div
          className={cn(
            'relative w-full h-full transition-transform duration-500 preserve-3d',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* ── Cara frontal ────────────────────────────────────────────── */}
          <div
            className="absolute inset-0 overflow-hidden backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              borderRadius: 16,
              backgroundColor: 'rgba(243, 246, 251, 0.4)',
            }}
          >
            {imageUrl ? (
              <>
                {/* Native img: works for any HTTPS URL without next/image remotePatterns / optimizer issues (strict networks, new CDNs). */}
                <img
                  src={imageUrl}
                  alt={challenge.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ borderRadius: 16 }}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                  style={{ borderRadius: 16 }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <p className="text-white font-semibold text-xs line-clamp-2 drop-shadow-md">
                    {challenge.title}
                  </p>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full text-2xl"
                style={{ backgroundColor: 'rgba(243, 246, 251, 0.4)' }}
              >
                <Camera className="w-8 h-8 text-[#595959] mb-1" strokeWidth={1.5} />
                <span className="text-lg">{challenge.icon}</span>
                <p className="mt-1 px-1 text-center text-xs font-medium text-[#595959] line-clamp-2">
                  {challenge.title}
                </p>
              </div>
            )}

            {isCompleted && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                style={{ borderRadius: 16, background: 'rgba(16, 185, 129, 0.82)' }}
              >
                <CheckCircle className="w-8 h-8 text-white" strokeWidth={2} />
                <span className="text-white text-[10px] font-bold tracking-wide uppercase">¡Listo!</span>
              </div>
            )}
            {!isCompleted && latestStatus === 'pending' && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-white text-[9px] font-semibold">
                En revision
              </div>
            )}
            {!isCompleted && latestStatus === 'approved' && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-green-600/90 text-white text-[9px] font-semibold">
                Aprobado
              </div>
            )}
            {!isCompleted && latestStatus === 'rejected' && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-semibold">
                Rechazado
              </div>
            )}
          </div>

          {/* ── Cara trasera ─────────────────────────────────────────────── */}
          <div
            className="absolute inset-0 overflow-hidden bg-white backface-hidden flex flex-col items-center justify-center p-2 gap-2"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 16,
            }}
          >
            {!showLinkInput ? (
              <>
                <p className="text-secondary-900 font-semibold text-xs text-center line-clamp-2">
                  {challenge.title}
                </p>

                {isCompleted && (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <span className="text-xs font-semibold text-green-600">¡Completado!</span>
                  </div>
                )}

                {/* Foto */}
                {!isCompleted && hasPhotoTask && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      disabled={submitting}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      {submitting ? 'Subiendo...' : 'Subir foto'}
                    </button>
                  </>
                )}

                {/* Link (Strava u otro) — solo si al menos una tarea pendiente lo requiere */}
                {!isCompleted && hasLinkTask && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowLinkInput(true);
                    }}
                    disabled={submitting}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-[#FC4C02] border border-[#FC4C02]/30 bg-[#FC4C02]/5 hover:bg-[#FC4C02]/10 transition-colors disabled:opacity-60"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#FC4C02">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                    Link Strava
                  </button>
                )}

                {/* Sin tareas */}
                {!isCompleted && hasNoTasks && (
                  <button
                    type="button"
                    onClick={handleCompleteClick}
                    disabled={submitting}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Completar
                  </button>
                )}
              </>
            ) : (
              /* Panel de ingreso de link */
              <div
                className="w-full flex flex-col gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#FC4C02] flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#FC4C02">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                    Link Strava
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowLinkInput(false); setLinkValue(''); setLinkError(''); }}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="url"
                  value={linkValue}
                  onChange={(e) => { setLinkValue(e.target.value); setLinkError(''); }}
                  placeholder="https://strava.com/activities/..."
                  className="w-full text-[10px] border border-secondary-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FC4C02] focus:border-[#FC4C02]"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />

                {linkError && (
                  <p className="text-[9px] text-red-500">{linkError}</p>
                )}

                <button
                  type="button"
                  onClick={handleLinkSubmit}
                  disabled={submitting}
                  className="w-full py-1.5 rounded-lg bg-[#FC4C02] text-white text-[10px] font-bold hover:bg-[#e04400] transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
