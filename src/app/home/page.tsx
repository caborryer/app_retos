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
const COMPLETED_CATEGORY = 'Tableros completados';
const HOME_DEBUG = process.env.NODE_ENV !== 'production';

export default function HomePage() {
  const { status } = useSession();
  const { challenges, setChallenges, setIsLoading } = useAppStore();
  const UNCATEGORIZED = 'Sin categoria';
  const CYCLING_CATEGORY = 'Bici';

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
  const [completedBoardIds, setCompletedBoardIds] = useState<string[]>([]);
  const boardCache = useRef<Record<string, Challenge[]>>({});
  const boardCompletedCache = useRef<Record<string, boolean>>({});
  const boardCompletionRequestCache = useRef<Record<string, Promise<boolean>>>({});
  const activeBoardIdRef = useRef<string | null>(null);
  activeBoardIdRef.current = activeBoardId;

  const getBoardCategory = useCallback((board: HomeBoard) => {
    const rawFolder = board.folder?.trim();
    const rawTitle = board.title?.trim() || '';
    const source = rawFolder || rawTitle;
    if (!source) return UNCATEGORIZED;
    const normalized = source
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const isCycling =
      normalized.includes('bici') ||
      normalized.includes('bike') ||
      normalized.includes('cycling') ||
      normalized.includes('cycl') ||
      normalized.includes('cicl');

    if (isCycling) {
      return CYCLING_CATEGORY;
    }
    return rawFolder || UNCATEGORIZED;
  }, []);

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
            ? data.find((b) => getBoardCategory(b) === savedPinned)
            : null;

          const firstVisible = data.find((b) => getBoardCategory(b) !== UNCATEGORIZED) ?? data[0];
          const chosen = preferred ?? firstVisible;
          const chosenCategory = getBoardCategory(chosen);
          setActiveBoardId(chosen.id);
          setActiveCategory(chosenCategory === UNCATEGORIZED ? COMPLETED_CATEGORY : chosenCategory);
          if (savedPinned) setPinnedCategory(savedPinned);
        }
      })
      .catch(console.error);
  }, [status, getBoardCategory]);

  // Restore pinned category preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HOME_PINNED_CATEGORY_KEY);
      if (saved) setPinnedCategory(saved);
    } catch {
      // ignore localStorage read issues
    }
  }, []);

  const incompleteBoards = useMemo(
    () => boards.filter((b) => !completedBoardIds.includes(b.id)),
    [boards, completedBoardIds]
  );

  const categories = useMemo(() => {
    const base = Array.from(
      new Set(
        incompleteBoards
          .map((b) => getBoardCategory(b))
          .filter((category) => category !== UNCATEGORIZED)
      )
    );
    const baseWithoutCompleted = base.filter((c) => c !== COMPLETED_CATEGORY);
    const ordered = (!pinnedCategory || !baseWithoutCompleted.includes(pinnedCategory))
      ? baseWithoutCompleted
      : [pinnedCategory, ...baseWithoutCompleted.filter((c) => c !== pinnedCategory)];
    return [...ordered, COMPLETED_CATEGORY];
  }, [incompleteBoards, pinnedCategory, getBoardCategory]);

  useEffect(() => {
    if (!pinnedCategory) return;
    try {
      window.localStorage.setItem(HOME_PINNED_CATEGORY_KEY, pinnedCategory);
    } catch {
      // ignore localStorage write issues
    }
  }, [pinnedCategory]);

  const completedBoards = useMemo(
    () => boards.filter((b) => completedBoardIds.includes(b.id)),
    [boards, completedBoardIds]
  );
  const boardsInActiveCategory = useMemo(() => {
    if (activeCategory === COMPLETED_CATEGORY) {
      return completedBoards;
    }
    return incompleteBoards.filter((b) => getBoardCategory(b) === activeCategory);
  }, [completedBoards, incompleteBoards, activeCategory, getBoardCategory]);
  useEffect(() => {
    if (!activeBoardId) return;
    if (challenges.length === 0) return;
    const isCompleted = challenges.every(
      (c) => c.status === ChallengeStatus.COMPLETED
    );
    boardCompletedCache.current[activeBoardId] = isCompleted;
    setCompletedBoardIds((prev) =>
      isCompleted
        ? (prev.includes(activeBoardId) ? prev : [...prev, activeBoardId])
        : prev.filter((id) => id !== activeBoardId)
    );
  }, [activeBoardId, challenges]);
  const isBoardCompleted = useCallback(async (boardId: string) => {
    if (boardCompletedCache.current[boardId] !== undefined) {
      return boardCompletedCache.current[boardId];
    }

    const cached = boardCache.current[boardId];
    if (cached && cached.length > 0) {
      const done = cached.every((c) => c.status === ChallengeStatus.COMPLETED);
      boardCompletedCache.current[boardId] = done;
      return done;
    }

    const inflight = boardCompletionRequestCache.current[boardId];
    if (inflight) return inflight;

    const request = fetch(`/api/challenges?boardId=${boardId}`, { credentials: 'include' })
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok || !Array.isArray(data)) return false;
        const list = data as Challenge[];
        boardCache.current[boardId] = list;
        const done = list.length > 0 && list.every((c) => c.status === ChallengeStatus.COMPLETED);
        boardCompletedCache.current[boardId] = done;
        return done;
      })
      .catch(() => false)
      .finally(() => {
        delete boardCompletionRequestCache.current[boardId];
      });

    boardCompletionRequestCache.current[boardId] = request;
    return request;
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || boards.length === 0) return;
    let cancelled = false;

    const syncCompletedBoards = async () => {
      const checks = await Promise.all(
        boards.map(async (board) => ({
          id: board.id,
          done: await isBoardCompleted(board.id),
        }))
      );
      if (cancelled) return;
      setCompletedBoardIds(checks.filter((row) => row.done).map((row) => row.id));
    };

    syncCompletedBoards().catch(() => {
      // ignore transient errors; local cache still updates from active board flow
    });

    return () => {
      cancelled = true;
    };
  }, [boards, status, isBoardCompleted]);


  const relatedBoards = useMemo(() => {
    return boardsInActiveCategory.filter((b) => b.id !== activeBoardId);
  }, [boards, boardsInActiveCategory, activeBoardId]);

  // Keep category in sync if board changes from other flows
  useEffect(() => {
    if (!activeBoardId) return;
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return;
    // Keep virtual completed category stable; do not force original folder.
    if (activeCategory === COMPLETED_CATEGORY) {
      if (HOME_DEBUG) {
        console.log('[home] preserving completed category view', {
          activeBoardId,
          isCompletedBoard: completedBoardIds.includes(activeBoardId),
        });
      }
      return;
    }
    const boardCategory = getBoardCategory(board);
    if (boardCategory !== activeCategory) {
      if (HOME_DEBUG) {
        console.log('[home] syncing category from board', {
          from: activeCategory,
          to: boardCategory,
          boardId: activeBoardId,
        });
      }
      setActiveCategory(boardCategory);
    }
  }, [activeBoardId, boards, activeCategory, completedBoardIds, getBoardCategory]);

  // Self-heal category/board selection when a category becomes empty
  // (e.g. boards moved to "Tableros completados" after completion sync).
  useEffect(() => {
    if (boards.length === 0 || categories.length === 0) return;

    const categoryExists = categories.includes(activeCategory);
    const hasBoardsInActiveCategory =
      activeCategory === COMPLETED_CATEGORY
        ? completedBoards.length > 0
        : boardsInActiveCategory.length > 0;

    if (categoryExists && hasBoardsInActiveCategory) return;

    const fallbackCategory = categories.find((category) => {
      if (category === COMPLETED_CATEGORY) return completedBoards.length > 0;
      return incompleteBoards.some((b) => getBoardCategory(b) === category);
    });

    if (!fallbackCategory) return;

    const fallbackBoard =
      fallbackCategory === COMPLETED_CATEGORY
        ? completedBoards[0]
        : incompleteBoards.find((b) => getBoardCategory(b) === fallbackCategory);

    if (HOME_DEBUG) {
      console.log('[home] fallback category/board applied', {
        activeCategory,
        fallbackCategory,
        fallbackBoardId: fallbackBoard?.id ?? null,
      });
    }

    setActiveCategory(fallbackCategory);
    if (fallbackBoard) {
      setActiveBoardId(fallbackBoard.id);
    }
  }, [
    boards,
    categories,
    activeCategory,
    boardsInActiveCategory,
    completedBoards,
    incompleteBoards,
  ]);

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
        const pinned = getBoardCategory(currentBoard);
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
  }, [boards, setChallenges, getBoardCategory]);

  const handleBingoContinue = useCallback(async () => {
    if (!activeBoardId || boards.length === 0 || categories.length === 0) return;

    const currentCategoryIdx = categories.findIndex((c) => c === activeCategory);
    const orderedCategories =
      currentCategoryIdx >= 0
        ? [...categories.slice(currentCategoryIdx + 1), ...categories.slice(0, currentCategoryIdx + 1)]
        : categories;

    for (const category of orderedCategories) {
      if (category === COMPLETED_CATEGORY) continue;
      const categoryBoards = incompleteBoards.filter((b) => getBoardCategory(b) === category);
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
  }, [activeBoardId, activeCategory, boards, categories, incompleteBoards, isBoardCompleted, getBoardCategory]);

  const switchBoard = useCallback((boardId: string) => {
    if (boardId === activeBoardId) return;
    setActiveBoardId(boardId);
  }, [activeBoardId]);

  const switchCategory = useCallback((category: string) => {
    if (category === activeCategory) return;
    if (HOME_DEBUG) {
      console.log('[home] switchCategory', {
        from: activeCategory,
        to: category,
        completedCount: completedBoards.length,
      });
    }
    setActiveCategory(category);
    const firstBoardInCategory = category === COMPLETED_CATEGORY
      ? completedBoards[0]
      : incompleteBoards.find((b) => getBoardCategory(b) === category);
    if (firstBoardInCategory) setActiveBoardId(firstBoardInCategory.id);
  }, [activeCategory, incompleteBoards, completedBoards, getBoardCategory]);

  // If user is in "Tableros completados" and boards arrive later, auto-select one.
  useEffect(() => {
    if (activeCategory !== COMPLETED_CATEGORY) return;
    if (completedBoards.length === 0) return;
    if (activeBoardId && completedBoards.some((b) => b.id === activeBoardId)) return;
    setActiveBoardId(completedBoards[0].id);
  }, [activeCategory, completedBoards, activeBoardId]);

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
                  {category === COMPLETED_CATEGORY && (
                    <span className="ml-1 text-[10px] opacity-90">({completedBoards.length})</span>
                  )}
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
                      const category = getBoardCategory(board);
                      if (category !== activeCategory) {
                        switchCategory(category);
                      }
                      switchBoard(board.id);
                    }}
                    className="shrink-0 text-left rounded-xl border border-secondary-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all"
                    style={{ width: 148 }}
                  >
                    {board.coverImage ? (
                      <div className="relative h-20 rounded-t-xl overflow-hidden">
                        <img
                          src={board.coverImage}
                          alt={`Portada de ${board.title}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                        <span className="absolute left-2 bottom-1 text-lg drop-shadow-sm">{board.emoji}</span>
                      </div>
                    ) : (
                      <div
                        className="h-20 rounded-t-xl flex items-center justify-center text-3xl"
                        style={{ background: `${board.color}22` }}
                      >
                        {board.emoji}
                      </div>
                    )}
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-secondary-900 truncate">{board.title}</p>
                      <p className="text-[11px] text-secondary-500 truncate">
                        {getBoardCategory(board)}
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
