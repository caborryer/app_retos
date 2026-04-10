'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import InfoAccordion from '@/components/bingo/InfoAccordion';
import { useAppStore } from '@/store/useAppStore';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';

export default function HomePage() {
  const { status } = useSession();
  const { challenges, setChallenges, setIsLoading } = useAppStore();

  const [boards, setBoards] = useState<{ id: string; title: string; emoji: string; color: string; coverImage: string | null; active: boolean }[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const boardCache = useRef<Record<string, Challenge[]>>({});

  // Fetch boards list on mount
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/boards')
      .then((r) => r.json())
      .then((data: { id: string; title: string; emoji: string; color: string; coverImage: string | null; active: boolean }[]) => {
        setBoards(data);
        if (data.length > 0) setActiveBoardId(data[0].id);
      })
      .catch(console.error);
  }, [status]);

  // Fetch challenges for active board
  useEffect(() => {
    if (!activeBoardId || status !== 'authenticated') return;

    setIsLoading(true);

    // Instant switch with cached board data (no full-screen loading flash)
    const cached = boardCache.current[activeBoardId];
    if (cached) {
      setChallenges(cached);
      setLoadingBoard(false);
    } else {
      setLoadingBoard(true);
    }

    fetch(`/api/challenges?boardId=${activeBoardId}`)
      .then((r) => r.json())
      .then((data: Challenge[]) => {
        boardCache.current[activeBoardId] = data;
        setChallenges(data);
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
        setLoadingBoard(false);
      });
  }, [activeBoardId, status]);

  // Background refresh so approval states update without manual reload
  useEffect(() => {
    if (!activeBoardId || status !== 'authenticated') return;
    const interval = setInterval(() => {
      fetch(`/api/challenges?boardId=${activeBoardId}`)
        .then((r) => r.json())
        .then((data: Challenge[]) => {
          boardCache.current[activeBoardId] = data;
          setChallenges(data);
        })
        .catch(() => {
          // Silent fail: keep current UI if a poll tick fails.
        });
    }, 10000);
    return () => clearInterval(interval);
  }, [activeBoardId, status, setChallenges]);

  const handleBingoContinue = useCallback(() => {
    const currentIdx = boards.findIndex((b) => b.id === activeBoardId);
    const nextBoard = boards[(currentIdx + 1) % boards.length];
    if (!nextBoard) return;

    setActiveBoardId(nextBoard.id);
  }, [activeBoardId, boards]);

  const switchBoard = useCallback((boardId: string) => {
    if (boardId === activeBoardId) return;
    setActiveBoardId(boardId);
  }, [activeBoardId]);

  if (status === 'loading' || loadingBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <Layout title="BingoChallenge">
      <div className="min-h-full pb-8">
        {/* Título + selector de tablero */}
        <div className="pt-1 pb-0" style={{ paddingLeft: '8.53%', paddingRight: 17 }}>
          <div className="flex items-center justify-between">
            <h1 className="text-[#1E1E22] font-semibold text-xl tracking-tight">
              Retos
            </h1>
            {boards.length > 1 && activeBoard && (
              <span className="text-xs text-secondary-400 font-medium">
                {activeBoard.emoji} {activeBoard.title}
              </span>
            )}
          </div>

          {/* Board tabs (if multiple boards) */}
          {boards.length > 1 && (
            <div
              className="flex gap-2 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => switchBoard(board.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    board.id === activeBoardId
                      ? 'text-white'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                  style={board.id === activeBoardId ? { backgroundColor: board.color } : undefined}
                >
                  {board.emoji} {board.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tablero */}
        <div className="w-full flex justify-center mt-4">
          {challenges.length > 0 && (
            <BingoBoard
              challenges={challenges}
              boardId={activeBoardId ?? ''}
              boardTitle={activeBoard?.title ?? 'Tablero'}
              boardNumber={boards.findIndex((b) => b.id === activeBoardId) + 1}
              boardColor={activeBoard?.color}
              boardCoverImage={activeBoard?.coverImage}
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
