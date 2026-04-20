'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import { useAppStore } from '@/store/useAppStore';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import { isChallengeNotStarted } from '@/lib/utils';

export default function HomePage() {
  const { status } = useSession();
  const { challenges, setChallenges, setIsLoading } = useAppStore();
  const UNCATEGORIZED = 'Sin categoria';

  type HomeBoard = {
    id: string;
    title: string;
    emoji: string;
    color: string;
    coverImage: string | null;
    active: boolean;
    folder: string | null;
    description?: string | null;
  };

  const [boards, setBoards] = useState<HomeBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(UNCATEGORIZED);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [startingBoardPlay, setStartingBoardPlay] = useState(false);
  const boardCache = useRef<Record<string, Challenge[]>>({});
  const activeBoardIdRef = useRef<string | null>(null);
  activeBoardIdRef.current = activeBoardId;

  const playLocked = useMemo(() => {
    if (!activeBoardId || challenges.length === 0) return false;
    const sameBoard = challenges.every((c) => !c.boardId || c.boardId === activeBoardId);
    if (!sameBoard) return false;
    return challenges.every((c) => isChallengeNotStarted(c.status));
  }, [challenges, activeBoardId]);

  // Fetch boards list on mount
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/boards')
      .then((r) => r.json())
      .then((data: HomeBoard[]) => {
        setBoards(data);
        if (data.length > 0) {
          setActiveBoardId(data[0].id);
          setActiveCategory(data[0].folder?.trim() || UNCATEGORIZED);
        }
      })
      .catch(console.error);
  }, [status]);

  const categories = useMemo(
    () => Array.from(new Set(boards.map((b) => b.folder?.trim() || UNCATEGORIZED))),
    [boards]
  );

  const boardsInActiveCategory = useMemo(
    () => boards.filter((b) => (b.folder?.trim() || UNCATEGORIZED) === activeCategory),
    [boards, activeCategory]
  );

  // Keep category in sync if board changes from other flows
  useEffect(() => {
    if (!activeBoardId) return;
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return;
    const boardCategory = board.folder?.trim() || UNCATEGORIZED;
    if (boardCategory !== activeCategory) {
      setActiveCategory(boardCategory);
    }
  }, [activeBoardId, boards, activeCategory]);

  // Fetch challenges for active board
  useEffect(() => {
    if (!activeBoardId || status !== 'authenticated') return;

    const boardIdForRequest = activeBoardId;
    let cancelled = false;

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
      .then((data: unknown) => {
        if (cancelled || activeBoardIdRef.current !== boardIdForRequest) return;
        if (!Array.isArray(data)) {
          console.error('[home] Invalid challenges response', data);
          return;
        }
        const list = data as Challenge[];
        boardCache.current[boardIdForRequest] = list;
        setChallenges(list);
      })
      .catch(console.error)
      .finally(() => {
        if (cancelled || activeBoardIdRef.current !== boardIdForRequest) return;
        setIsLoading(false);
        setLoadingBoard(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBoardId, status, setChallenges, setIsLoading]);

  // Background refresh so approval states update without manual reload
  useEffect(() => {
    if (!activeBoardId || status !== 'authenticated') return;
    const interval = setInterval(() => {
      const boardId = activeBoardIdRef.current;
      if (!boardId) return;
      fetch(`/api/challenges?boardId=${boardId}`)
        .then((r) => r.json())
        .then((data: unknown) => {
          if (activeBoardIdRef.current !== boardId) return;
          if (!Array.isArray(data)) return;
          const list = data as Challenge[];
          boardCache.current[boardId] = list;
          setChallenges(list);
        })
        .catch(() => {
          // Silent fail: keep current UI if a poll tick fails.
        });
    }, 10000);
    return () => clearInterval(interval);
  }, [activeBoardId, status, setChallenges]);

  const handleStartBoardPlay = useCallback(async () => {
    const boardId = activeBoardIdRef.current;
    if (!boardId) return;
    setStartingBoardPlay(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/start`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof body.error === 'string' ? body.error : 'No se pudo iniciar el tablero.');
        return;
      }
      if (activeBoardIdRef.current !== boardId) return;
      const r = await fetch(`/api/challenges?boardId=${boardId}`);
      const data: unknown = await r.json();
      if (activeBoardIdRef.current !== boardId) return;
      if (!r.ok || !Array.isArray(data)) {
        alert('El tablero se inició pero no se pudieron cargar los retos. Recarga la página.');
        return;
      }
      const list = data as Challenge[];
      boardCache.current[boardId] = list;
      setChallenges(list);
    } catch {
      alert('Error de red al iniciar el tablero.');
    } finally {
      setStartingBoardPlay(false);
    }
  }, [setChallenges]);

  const handleBingoContinue = useCallback(() => {
    if (boardsInActiveCategory.length === 0) return;
    const currentIdx = boardsInActiveCategory.findIndex((b) => b.id === activeBoardId);
    const nextBoard = boardsInActiveCategory[(currentIdx + 1) % boardsInActiveCategory.length];
    if (!nextBoard) return;

    setActiveBoardId(nextBoard.id);
  }, [activeBoardId, boardsInActiveCategory]);

  const switchBoard = useCallback((boardId: string) => {
    if (boardId === activeBoardId) return;
    setActiveBoardId(boardId);
  }, [activeBoardId]);

  const switchCategory = useCallback((category: string) => {
    if (category === activeCategory) return;
    setActiveCategory(category);
    const firstBoardInCategory = boards.find(
      (b) => (b.folder?.trim() || UNCATEGORIZED) === category
    );
    if (firstBoardInCategory) setActiveBoardId(firstBoardInCategory.id);
  }, [activeCategory, boards]);

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
            {activeBoard && (
              <span className="text-xs text-secondary-400 font-medium">
                {activeBoard.emoji} {activeBoard.title}
              </span>
            )}
          </div>

          {/* Category tabs */}
          {categories.length > 0 && (
            <div
              className="flex gap-2 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => switchCategory(category)}
                  aria-pressed={category === activeCategory}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === activeCategory
                      ? 'text-white'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                  style={category === activeCategory ? { backgroundColor: activeBoard?.color ?? '#FC0230' } : undefined}
                >
                  {category}
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
              playLocked={playLocked}
              onStartPlay={handleStartBoardPlay}
              startingPlay={startingBoardPlay}
            />
          )}
        </div>

        {/* Progreso del tablero */}
        <div className="w-full flex justify-center mt-4 px-6">
          <div className="w-full" style={{ maxWidth: 326 }}>
            <CompletionBar challenges={challenges} />
          </div>
        </div>

        {/* The board gallery section was intentionally removed to keep Home focused */}

        {/* Info / Reglas / TyC / FAQ
        <div className="w-full flex justify-center mt-6 px-6">
          <div className="w-full" style={{ maxWidth: 326 }}>
            <InfoAccordion />
          </div>
        </div>
        */}
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
