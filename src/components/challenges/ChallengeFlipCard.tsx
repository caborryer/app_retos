'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle, Link as LinkIcon, X } from 'lucide-react';
import type { Challenge } from '@/types';
import { ChallengeCategory, ChallengeStatus } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Categorías que permiten link de Strava
const STRAVA_CATEGORIES: ChallengeCategory[] = [
  ChallengeCategory.RUNNING,
  ChallengeCategory.CYCLING,
  ChallengeCategory.GYM,
  ChallengeCategory.SWIMMING,
  ChallengeCategory.YOGA,
  ChallengeCategory.TEAM_SPORTS,
  ChallengeCategory.OUTDOOR,
  ChallengeCategory.MIXED,
];

function isValidStravaOrSportsLink(url: string): boolean {
  try {
    const u = new URL(url);
    // Acepta strava.com/activities/... o cualquier URL https
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

interface ChallengeFlipCardProps {
  challenge: Challenge;
  className?: string;
}

export default function ChallengeFlipCard({ challenge, className }: ChallengeFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { completeChallenge, uploadPhotoAndComplete, submitLinkAndComplete } = useAppStore();

  const imageUrl = challenge.images?.[0] ?? null;
  const isCompleted = challenge.status === ChallengeStatus.COMPLETED;
  const hasPhotoTask = challenge.tasks?.some((t) => t.photoRequired) ?? false;
  const hasNoTasks = !challenge.tasks || challenge.tasks.length === 0;
  const supportsStrava = STRAVA_CATEGORIES.includes(challenge.category);

  const handleCardInteraction = () => {
    if (isCompleted) return;
    if (!showLinkInput) setIsFlipped((prev) => !prev);
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    completeChallenge(challenge.id);
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
    const reader = new FileReader();
    reader.onload = () => {
      uploadPhotoAndComplete(challenge.id, reader.result as string);
      setIsFlipped(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLinkSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = linkValue.trim();
    if (!trimmed) {
      setLinkError('Ingresa un link válido');
      return;
    }
    if (!isValidStravaOrSportsLink(trimmed)) {
      setLinkError('El link debe comenzar con https://');
      return;
    }
    submitLinkAndComplete(challenge.id, trimmed);
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
                <Image
                  src={imageUrl}
                  alt={challenge.title}
                  fill
                  className="object-cover"
                  sizes="100px"
                  style={{ borderRadius: 16 }}
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
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      Subir foto
                    </button>
                  </>
                )}

                {/* Strava / link deportivo */}
                {!isCompleted && supportsStrava && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowLinkInput(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-[#FC4C02] border border-[#FC4C02]/30 bg-[#FC4C02]/5 hover:bg-[#FC4C02]/10 transition-colors"
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
                  className="w-full py-1.5 rounded-lg bg-[#FC4C02] text-white text-[10px] font-bold hover:bg-[#e04400] transition-colors"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
