'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle } from 'lucide-react';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ChallengeFlipCardProps {
  challenge: Challenge;
  className?: string;
}

export default function ChallengeFlipCard({ challenge, className }: ChallengeFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { completeChallenge, uploadPhotoAndComplete } = useAppStore();

  const imageUrl = challenge.images?.[0] ?? null;
  const isCompleted = challenge.status === ChallengeStatus.COMPLETED;
  const hasPhotoTask = challenge.tasks?.some((t) => t.photoRequired) ?? false;
  const hasNoTasks = !challenge.tasks || challenge.tasks.length === 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCardInteraction = () => {
    if (isCompleted) return; // card completada no hace flip
    setIsFlipped((prev) => !prev);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn('group/card w-full aspect-square', className)}
      onMouseEnter={() => { if (!isCompleted) setIsFlipped(true); }}
      onMouseLeave={() => setIsFlipped(false)}
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
          {/* ── Cara frontal ─────────────────────────────────────────────── */}
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

            {/* Overlay verde cuando está completado */}
            {isCompleted && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                style={{ borderRadius: 16, background: 'rgba(16, 185, 129, 0.82)' }}
              >
                <CheckCircle className="w-8 h-8 text-white" strokeWidth={2} />
                <span className="text-white text-[10px] font-bold tracking-wide uppercase">
                  ¡Listo!
                </span>
              </div>
            )}
          </div>

          {/* ── Cara trasera ─────────────────────────────────────────────── */}
          <div
            className="absolute inset-0 overflow-hidden bg-white backface-hidden flex flex-col items-center justify-center p-2"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 16,
            }}
          >
            <p className="text-secondary-900 font-semibold text-sm text-center line-clamp-2 mb-3">
              {challenge.title}
            </p>

            {/* Completado */}
            {isCompleted && (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-xs font-semibold text-green-600">¡Completado!</span>
              </div>
            )}

            {/* Reto con foto — cualquier estado no completado */}
            {!isCompleted && hasPhotoTask && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={handlePhotoClick}
                  leftIcon={<Camera className="w-4 h-4" />}
                >
                  Subir foto
                </Button>
              </>
            )}

            {/* Reto sin tareas — completar directo */}
            {!isCompleted && hasNoTasks && (
              <Button
                size="sm"
                onClick={handleCompleteClick}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Completar
              </Button>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
