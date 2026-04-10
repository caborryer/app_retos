'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import ChallengeFlipCard from '@/components/challenges/ChallengeFlipCard';
import BingoModal from './BingoModal';
interface BingoBoardProps {
  challenges: Challenge[];
  boardId: string;
  boardTitle: string;
  boardNumber: number;
  boardColor?: string;
  boardCoverImage?: string | null;
  onBingoContinue: () => void;
}

function EmptyCell({ coverImage }: { coverImage?: string | null }) {
  if (coverImage) {
    return (
      <div className="w-full aspect-square rounded-[16px] overflow-hidden relative">
        <img
          src={coverImage}
          alt="Casilla especial"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ borderRadius: 16 }}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  return (
    <div
      className="w-full aspect-square rounded-[16px] flex items-center justify-center text-white/30 text-3xl"
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

const BINGO_SEEN_PREFIX = 'bingo-seen-';

export function BingoBoard({ challenges, boardId, boardTitle, boardNumber, boardColor = '#FC0230', boardCoverImage, onBingoContinue }: BingoBoardProps) {
  const [showBingo, setShowBingo] = useState(false);

  // Cerrar modal cuando cambia el tablero
  useEffect(() => {
    setShowBingo(false);
  }, [boardId]);

  // Detectar todos los retos completados — solo mostrar si aún no fue visto
  useEffect(() => {
    if (challenges.length === 0 || showBingo || !boardId) return;
    const allDone = challenges.every((c) => c.status === ChallengeStatus.COMPLETED);
    if (!allDone) return;

    const key = BINGO_SEEN_PREFIX + boardId;
    if (localStorage.getItem(key) === '1') return;

    // Marcar como visto ANTES del timeout para que recargas no retriggereen el modal
    localStorage.setItem(key, '1');
    const timer = setTimeout(() => setShowBingo(true), 600);
    return () => clearTimeout(timer);
  }, [challenges, showBingo, boardId]);

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
        className="rounded-[15px] overflow-hidden w-full mx-auto"
        style={{
          background: `linear-gradient(180deg, ${boardColor} 0%, ${boardColor}CC 100%)`,
          maxWidth: 326,
        }}
      >
        <div className="grid grid-cols-3 w-full" style={{ gap: 8, padding: '7px 5px 6px 5px' }}>
          {cells.map((challenge, index) =>
            challenge ? (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="aspect-square w-full"
              >
                <ChallengeFlipCard challenge={challenge} />
              </motion.div>
            ) : (
              <EmptyCell key={`empty-${index}`} coverImage={boardCoverImage} />
            )
          )}
        </div>
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
