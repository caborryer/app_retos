'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import { useAppStore } from '@/store/useAppStore';
import { THEMED_BOARDS } from '@/lib/mockData';
import type { ThemedBoard } from '@/lib/mockData';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';

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
  const ready = useAuthGuard();
  const { challenges, resetChallenges, setIsLoading } = useAppStore();
  const [activeBoard, setActiveBoard] = useState<ThemedBoard>(THEMED_BOARDS[0]);
  const [confirmBoard, setConfirmBoard] = useState<ThemedBoard | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setIsLoading(false);
    if (challenges.length === 0) {
      resetChallenges(makeFreshBoard(THEMED_BOARDS[0].challenges));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = challenges.filter(
    (c) => c.status === ChallengeStatus.COMPLETED
  ).length;
  const allDone = challenges.length > 0 && completedCount === challenges.length;
  const hasProgress = completedCount > 0 && !allDone;

  const switchBoard = useCallback((board: ThemedBoard) => {
    if (board.id === activeBoard.id) return;
    // Si hay progreso sin completar, pedir confirmación
    if (hasProgress) {
      setConfirmBoard(board);
      return;
    }
    setActiveBoard(board);
    resetChallenges(makeFreshBoard(board.challenges));
  }, [activeBoard.id, hasProgress, resetChallenges]);

  const handleBingoContinue = useCallback(() => {
    const currentIndex = THEMED_BOARDS.findIndex((b) => b.id === activeBoard.id);
    const next = THEMED_BOARDS[(currentIndex + 1) % THEMED_BOARDS.length];
    setActiveBoard(next);
    resetChallenges(makeFreshBoard(next.challenges));
  }, [activeBoard.id, resetChallenges]);

  const confirmSwitch = () => {
    if (!confirmBoard) return;
    setActiveBoard(confirmBoard);
    resetChallenges(makeFreshBoard(confirmBoard.challenges));
    setConfirmBoard(null);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout title="BingoChallenge">
      <div className="min-h-full pb-8">

        {/* ── Título ─────────────────────────────────────────────────────── */}
        <div className="pt-1 pb-0" style={{ paddingLeft: '8.53%', paddingRight: 17 }}>
          <div className="flex items-center justify-between">
            <h1 className="text-[#1E1E22] font-semibold text-xl tracking-tight">
              {activeBoard.title}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{activeBoard.emoji}</span>
              <span className="text-xs text-secondary-400 font-medium">
                {activeBoard.title}
              </span>
            </div>
          </div>
        </div>

        {/* ── Selector de categorías ──────────────────────────────────────── */}
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          style={{ paddingLeft: '8.53%', paddingRight: 17 }}
        >
          {THEMED_BOARDS.map((board) => {
            const isActive = board.id === activeBoard.id;
            return (
              <button
                key={board.id}
                type="button"
                onClick={() => switchBoard(board)}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95"
                style={
                  isActive
                    ? {
                        background: board.color,
                        color: '#fff',
                        boxShadow: `0 2px 8px ${board.color}55`,
                      }
                    : {
                        backgroundColor: `${board.color}15`,
                        color: board.color,
                        border: `1.5px solid ${board.color}30`,
                      }
                }
              >
                <span style={{ fontSize: 14 }}>{board.emoji}</span>
                {board.title}
              </button>
            );
          })}
        </div>

        {/* ── Tablero ─────────────────────────────────────────────────────── */}
        <div className="w-full flex justify-center mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBoard.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex justify-center"
            >
              {challenges.length > 0 && (
                <BingoBoard
                  challenges={challenges}
                  boardTitle={activeBoard.title}
                  boardNumber={1}
                  onBingoContinue={handleBingoContinue}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Barra de progreso ───────────────────────────────────────────── */}
        <div className="w-full flex justify-center mt-4 px-6">
          <div className="w-full" style={{ maxWidth: 326 }}>
            <CompletionBar
              completed={completedCount}
              total={challenges.length}
              color={activeBoard.color}
            />
          </div>
        </div>

        {/* ── Modal de confirmación al cambiar con progreso ───────────────── */}
        <AnimatePresence>
          {confirmBoard && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setConfirmBoard(null)}
              />
              <motion.div
                className="relative w-full max-w-xs bg-white rounded-2xl p-6 shadow-2xl"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <div className="text-center mb-4">
                  <span style={{ fontSize: 36 }}>{confirmBoard.emoji}</span>
                  <h3 className="text-secondary-900 font-bold text-base mt-2">
                    ¿Cambiar a {confirmBoard.title}?
                  </h3>
                  <p className="text-secondary-500 text-xs mt-1">
                    Tienes {completedCount} reto{completedCount !== 1 ? 's' : ''} completado{completedCount !== 1 ? 's' : ''}.
                    Si cambias ahora perderás el progreso actual.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmBoard(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-secondary-600 bg-secondary-100 active:scale-95 transition-transform"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmSwitch}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                    style={{ background: confirmBoard.color }}
                  >
                    Cambiar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}

function CompletionBar({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-secondary-500">
          {completed} / {total} retos completados
        </span>
        <span className="text-xs font-semibold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
