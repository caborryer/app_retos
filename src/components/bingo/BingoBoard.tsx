'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import ChallengeFlipCard from '@/components/challenges/ChallengeFlipCard';
import BingoModal from './BingoModal';
import Image from 'next/image'; 
interface BingoBoardProps {
  challenges: Challenge[];
  boardTitle: string;
  boardNumber: number;
  onBingoContinue: () => void;
}

function EmptyCell() {
  return (
    <div className="w-full aspect-square rounded-[16px] overflow-hidden relative">
      <Image
        src="https://i.ibb.co/C3wDYt0T/Whats-App-Image-2026-03-25-at-12-34-56-PM.jpg"
        alt="Casilla especial"
        fill
        className="object-cover"
        sizes="100px"
        style={{ borderRadius: 16 }}
      />
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

export function BingoBoard({ challenges, boardTitle, boardNumber, onBingoContinue }: BingoBoardProps) {
  const [showBingo, setShowBingo] = useState(false);

  // Cerrar modal cuando cambia el tablero
  useEffect(() => {
    setShowBingo(false);
  }, [boardNumber, boardTitle]);

  // Detectar todos los retos completados
  useEffect(() => {
    if (challenges.length === 0 || showBingo) return;
    const allDone = challenges.every((c) => c.status === ChallengeStatus.COMPLETED);
    if (allDone) {
      const timer = setTimeout(() => setShowBingo(true), 600);
      return () => clearTimeout(timer);
    }
  }, [challenges, showBingo]);

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
          background: 'linear-gradient(180deg, #FF5327 0%, #FF3B1D 100%)',
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
              <EmptyCell key={`empty-${index}`} />
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
