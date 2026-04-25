'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import ChallengeFlipCard from '@/components/challenges/ChallengeFlipCard';
import BingoModal from './BingoModal';
import { cn } from '@/lib/utils';

interface BingoBoardProps {
  challenges: Challenge[];
  boardId: string;
  boardTitle: string;
  boardNumber: number;
  boardColor?: string;
  boardCoverImage?: string | null;
  onBingoContinue: () => void;
  /** When true, the board is covered until the user confirms start (full-board overlay). */
  playLocked?: boolean;
  onStartPlay?: () => void | Promise<void>;
  startingPlay?: boolean;
}

function EmptyCell({ coverImage }: { coverImage?: string | null }) {
  if (coverImage) {
    return (
      <div className="w-full h-full rounded-[16px] overflow-hidden">
        <img
          src={coverImage}
          alt="Casilla especial"
          className="block w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  return (
    <div
      className="w-full h-full rounded-[16px] flex items-center justify-center text-white/30 text-3xl"
      style={{ background: 'rgba(255,255,255,0.12)' }}
    >
      ⭐
    </div>
  );
}

function buildCells(challenges: Challenge[]): (Challenge | null)[] {
  const GRID_SIZE = 9;
  const CENTER = Math.floor(GRID_SIZE / 2); // índice 4
  const filled = challenges.slice(0, GRID_SIZE - 1); // máx 8 retos
  return [
    ...filled.slice(0, CENTER),
    null,
    ...filled.slice(CENTER),
  ];
}

export function BingoBoard({
  challenges,
  boardId,
  boardTitle,
  boardNumber,
  boardColor = '#FC0230',
  boardCoverImage,
  onBingoContinue,
  playLocked = false,
  onStartPlay,
  startingPlay = false,
}: BingoBoardProps) {
  const [showBingo, setShowBingo] = useState(false);
  const seenInSessionRef = useRef<Record<string, boolean>>({});

  // Cerrar modal cuando cambia el tablero
  useEffect(() => {
    setShowBingo(false);
  }, [boardId]);

  // Detectar todos los retos completados.
  // Se evita localStorage para no arrastrar estados "stale" entre tableros/sesiones.
  // Mostramos una vez por tablero en la sesión actual y rearmamos si deja de estar completo.
  useEffect(() => {
    if (playLocked || challenges.length === 0 || showBingo || !boardId) return;
    const allDone = challenges.every((c) => c.status === ChallengeStatus.COMPLETED);
    if (!allDone) {
      seenInSessionRef.current[boardId] = false;
      return;
    }
    if (seenInSessionRef.current[boardId]) return;

    const timer = setTimeout(() => {
      seenInSessionRef.current[boardId] = true;
      setShowBingo(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [challenges, showBingo, boardId, playLocked]);

  const totalPoints = challenges.reduce((acc, c) => acc + c.points, 0);
  const cells = buildCells(challenges);

  const handleContinue = () => {
    setShowBingo(false);
    onBingoContinue();
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-[15px] overflow-hidden w-full mx-auto"
        style={{
          background: `linear-gradient(180deg, ${boardColor} 0%, ${boardColor}CC 100%)`,
          maxWidth: 326,
        }}
      >
        <div
          className={cn(
            'grid grid-cols-3 w-full',
            playLocked && 'pointer-events-none select-none'
          )}
          style={{ gap: 8, padding: '7px 5px 6px 5px' }}
        >
          {cells.map((challenge, index) =>
            challenge ? (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className={cn('aspect-square w-full', playLocked && 'opacity-50')}
              >
                <ChallengeFlipCard challenge={challenge} />
              </motion.div>
            ) : (
              <div key={`empty-${index}`} className="aspect-square w-full">
                <EmptyCell coverImage={boardCoverImage} />
              </div>
            )
          )}
        </div>

        {playLocked && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-5 py-8 bg-black/55 backdrop-blur-[3px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bingo-start-play-title"
          >
            <p
              id="bingo-start-play-title"
              className="text-white text-center text-sm sm:text-base font-semibold leading-snug drop-shadow-md max-w-[260px]"
            >
              ¿Deseas iniciar este bingo?
            </p>
            <button
              type="button"
              onClick={() => void onStartPlay?.()}
              disabled={startingPlay || !onStartPlay}
              className="px-6 py-2.5 rounded-xl bg-white text-secondary-900 text-sm font-bold shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {startingPlay ? 'Iniciando…' : 'Aceptar'}
            </button>
          </div>
        )}
      </motion.section>

      <BingoModal
        open={showBingo}
        boardNumber={boardNumber}
        totalPoints={totalPoints}
        onContinue={handleContinue}
      />
    </>
  );
}
