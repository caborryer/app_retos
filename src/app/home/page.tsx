'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import InfoAccordion from '@/components/bingo/InfoAccordion';
import { useAppStore } from '@/store/useAppStore';
import { mockChallenges, mockChallengesBoard2 } from '@/lib/mockData';
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
  const router = useRouter();
  const { challenges, resetChallenges, setIsLoading } = useAppStore();
  const [boardIndex, setBoardIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  // Ref para saber si ya inicializamos (evita doble init en StrictMode)
  const initialized = useRef(false);

  useEffect(() => {
    const init = () => {
      const { currentUser } = useAppStore.getState();
      if (!currentUser) {
        router.replace('/login');
        return;
      }
      setMounted(true);
      if (initialized.current) return;
      initialized.current = true;
      setIsLoading(false);
      if (challenges.length === 0) {
        resetChallenges(makeFreshBoard(ALL_BOARDS[0]));
      }
    };

    if (useAppStore.persist.hasHydrated()) {
      init();
    } else {
      const unsub = useAppStore.persist.onFinishHydration(init);
      return unsub;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBingoContinue = useCallback(() => {
    setBoardIndex((prev) => {
      const next = prev + 1 < ALL_BOARDS.length ? prev + 1 : 0;
      resetChallenges(makeFreshBoard(ALL_BOARDS[next]));
      return next;
    });
  }, [resetChallenges]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout title="BingoChallenge">
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
              boardTitle={`Tablero ${boardIndex + 1}`}
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

        {/* Info / Reglas / TyC / FAQ */}
        <div className="w-full flex justify-center mt-6 px-6">
          <div className="w-full" style={{ maxWidth: 326 }}>
            <InfoAccordion />
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
            background: 'linear-gradient(90deg, #FC0230 0%, #FC0230 100%)',
          }}
        />
      </div>
    </div>
  );
}
