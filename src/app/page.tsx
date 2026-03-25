'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import { useAppStore } from '@/store/useAppStore';
import { mockUser, mockChallenges, mockChallengesBoard2 } from '@/lib/mockData';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';

// Todos los tableros disponibles
const ALL_BOARDS: Challenge[][] = [
  mockChallenges.slice(0, 9),
  mockChallengesBoard2.slice(0, 9),
];

function makeFreshBoard(template: Challenge[]): Challenge[] {
  return template.map((c) => ({
    ...c,
    status: ChallengeStatus.NOT_STARTED,
    progress: 0,
    tasks: c.tasks.map((t) => ({
      ...t,
      completed: false,
      completedAt: undefined,
      photoUrl: undefined,
    })),
  }));
}

export default function HomePage() {
  const { user, setUser, challenges, resetChallenges, setIsLoading } = useAppStore();
  const [boardIndex, setBoardIndex] = useState(0);
  // Ref para saber si ya inicializamos (evita doble init en StrictMode)
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!user) setUser(mockUser);
    setIsLoading(false);

    // Solo cargar el tablero inicial si el store está vacío
    if (challenges.length === 0) {
      resetChallenges(makeFreshBoard(ALL_BOARDS[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBingoContinue = useCallback(() => {
    setBoardIndex((prev) => {
      const next = prev + 1 < ALL_BOARDS.length ? prev + 1 : 0;
      // Cargar el siguiente tablero con retos frescos
      resetChallenges(makeFreshBoard(ALL_BOARDS[next]));
      return next;
    });
  }, [resetChallenges]);

  return (
    <Layout title="SportChallenge">
      <div className="min-h-full pb-8">
        {/* Título */}
        <div className="pt-1 pb-0" style={{ paddingLeft: '8.53%', paddingRight: 17 }}>
          <div className="flex items-center justify-between">
            <h1 className="text-[#1E1E22] font-semibold text-xl tracking-tight">
              Retos
            </h1>
            <span className="text-xs text-secondary-400 font-medium">
              Tablero {boardIndex + 1}
            </span>
          </div>
        </div>

        {/* Tablero */}
        <div className="w-full flex justify-center mt-4">
          {challenges.length > 0 && (
            <BingoBoard
              challenges={challenges}
              boardNumber={boardIndex + 1}
              onBingoContinue={handleBingoContinue}
            />
          )}
        </div>

        {/* Progreso del tablero */}
        <div className="w-full flex justify-center mt-4 px-6">
          <div className="w-full" style={{ maxWidth: 326 }}>
            <CompletionBar challenges={challenges} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function CompletionBar({ challenges }: { challenges: Challenge[] }) {
  const completed = challenges.filter((c) => c.status === ChallengeStatus.COMPLETED).length;
  const total = challenges.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-secondary-500">
          {completed} / {total} retos completados
        </span>
        <span className="text-xs font-semibold text-primary-500">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #FF5327 0%, #FC0230 100%)',
          }}
        />
      </div>
    </div>
  );
}
