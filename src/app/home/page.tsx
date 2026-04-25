'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import InfoAccordion from '@/components/bingo/InfoAccordion';
import { useAppStore } from '@/store/useAppStore';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import { isChallengeNotStarted } from '@/lib/utils';

const HOME_PINNED_CATEGORY_KEY = 'home-pinned-category-v1';

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
  const [pinnedCategory, setPinnedCategory] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [startingBoardPlay, setStartingBoardPlay] = useState(false);
  const boardCache = useRef<Record<string, Challenge[]>>({});
  const boardCompletedCache = useRef<Record<string, boolean>>({});
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
          let savedPinned: string | null = null;
          try {
            savedPinned = window.localStorage.getItem(HOME_PINNED_CATEGORY_KEY);
          } catch {
            savedPinned = null;
          }

          const preferred = savedPinned
            ? data.find((b) => (b.folder?.trim() || UNCATEGORIZED) === savedPinned)
            : null;

          const chosen = preferred ?? data[0];
          const chosenCategory = chosen.folder?.trim() || UNCATEGORIZED;
          setActiveBoardId(chosen.id);
          setActiveCategory(chosenCategory);
          if (savedPinned) setPinnedCategory(savedPinned);
        }
      })
      .catch(console.error);
  }, [status]);

  // Restore pinned category preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HOME_PINNED_CATEGORY_KEY);
      if (saved) setPinnedCategory(saved);
    } catch {
      // ignore localStorage read issues
    }
  }, []);

  const categories = useMemo(() => {
    const base = Array.from(new Set(boards.map((b) => b.folder?.trim() || UNCATEGORIZED)));
    if (!pinnedCategory || !base.includes(pinnedCategory)) return base;
    return [pinnedCategory, ...base.filter((c) => c !== pinnedCategory)];
  }, [boards, pinnedCategory]);

  useEffect(() => {
    if (!pinnedCategory) return;
    try {
      window.localStorage.setItem(HOME_PINNED_CATEGORY_KEY, pinnedCategory);
    } catch {
      // ignore localStorage write issues
    }
  }, [pinnedCategory]);

  const boardsInActiveCategory = useMemo(
    () => boards.filter((b) => (b.folder?.trim() || UNCATEGORIZED) === activeCategory),
    [boards, activeCategory]
  );
  useEffect(() => {
    if (!activeBoardId) return;
    if (challenges.length === 0) return;
    boardCompletedCache.current[activeBoardId] = challenges.every(
      (c) => c.status === ChallengeStatus.COMPLETED
    );
  }, [activeBoardId, challenges]);

  const relatedBoards = useMemo(() => {
    return boardsInActiveCategory.filter((b) => b.id !== activeBoardId);
  }, [boards, boardsInActiveCategory, activeBoardId]);

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
    const currentBoard = boards.find((b) => b.id === boardId);
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
      // UX: cuando el usuario inicia un tablero, priorizamos su categoría al inicio de badges.
      if (currentBoard) {
        const pinned = currentBoard.folder?.trim() || UNCATEGORIZED;
        setPinnedCategory(pinned);
        try {
          window.localStorage.setItem(HOME_PINNED_CATEGORY_KEY, pinned);
        } catch {
          // ignore localStorage write issues
        }
      }
    } catch {
      alert('Error de red al iniciar el tablero.');
    } finally {
      setStartingBoardPlay(false);
    }
  }, [boards, setChallenges]);

  const handleBingoContinue = useCallback(async () => {
    if (!activeBoardId || boards.length === 0 || categories.length === 0) return;

    const currentCategoryIdx = categories.findIndex((c) => c === activeCategory);
    const orderedCategories =
      currentCategoryIdx >= 0
        ? [...categories.slice(currentCategoryIdx + 1), ...categories.slice(0, currentCategoryIdx + 1)]
        : categories;

    const isBoardCompleted = async (boardId: string) => {
      if (boardCompletedCache.current[boardId] !== undefined) {
        return boardCompletedCache.current[boardId];
      }

      const cached = boardCache.current[boardId];
      if (cached && cached.length > 0) {
        const done = cached.every((c) => c.status === ChallengeStatus.COMPLETED);
        boardCompletedCache.current[boardId] = done;
        return done;
      }

      try {
        const res = await fetch(`/api/challenges?boardId=${boardId}`, { credentials: 'include' });
        const data: unknown = await res.json();
        if (!res.ok || !Array.isArray(data)) return false;
        const list = data as Challenge[];
        boardCache.current[boardId] = list;
        const done = list.length > 0 && list.every((c) => c.status === ChallengeStatus.COMPLETED);
        boardCompletedCache.current[boardId] = done;
        return done;
      } catch {
        return false;
      }
    };

    for (const category of orderedCategories) {
      const categoryBoards = boards.filter((b) => (b.folder?.trim() || UNCATEGORIZED) === category);
      for (const board of categoryBoards) {
        const done = await isBoardCompleted(board.id);
        if (!done) {
          if (category !== activeCategory) {
            setActiveCategory(category);
          }
          setActiveBoardId(board.id);
          return;
        }
      }
    }
  }, [activeBoardId, activeCategory, boards, categories]);

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

        {/* Tableros relacionados */}
        {relatedBoards.length > 0 && (
          <div className="w-full flex justify-center mt-6 px-6">
            <div className="w-full" style={{ maxWidth: 360 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-secondary-800">Tableros relacionados</h2>
                <span className="text-[11px] text-secondary-500">
                  {relatedBoards.length} disponible{relatedBoards.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
              >
                {relatedBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => {
                      const category = board.folder?.trim() || UNCATEGORIZED;
                      if (category !== activeCategory) {
                        switchCategory(category);
                      }
                      switchBoard(board.id);
                    }}
                    className="shrink-0 text-left rounded-xl border border-secondary-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all"
                    style={{ width: 148 }}
                  >
                    <div
                      className="h-20 rounded-t-xl flex items-center justify-center text-3xl"
                      style={{
                        background: board.coverImage
                          ? `linear-gradient(135deg, ${board.color}33 0%, ${board.color}66 100%)`
                          : `${board.color}22`,
                      }}
                    >
                      {board.emoji}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-secondary-900 truncate">{board.title}</p>
                      <p className="text-[11px] text-secondary-500 truncate">
                        {board.folder?.trim() || UNCATEGORIZED}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
