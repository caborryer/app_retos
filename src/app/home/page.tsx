'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { BingoBoard } from '@/components/bingo/BingoBoard';
import BoardDetailSheet from '@/components/bingo/BoardDetailSheet';
import InfoAccordion from '@/components/bingo/InfoAccordion';
import { useAppStore } from '@/store/useAppStore';
import type { Challenge } from '@/types';
import { ChallengeStatus } from '@/types';
import { isChallengeNotStarted } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media-url';

type BoardPlayStatus = 'completed' | 'not_started' | 'in_progress' | 'unknown';

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

const STATUS_SORT_ORDER: Record<BoardPlayStatus, number> = {
  not_started: 0,
  unknown: 1,
  in_progress: 2,
  completed: 3,
};

function sortBoardsByPlayStatus(
  list: HomeBoard[],
  getStatus: (boardId: string) => BoardPlayStatus,
  orderIndex: Map<string, number>
): HomeBoard[] {
  return [...list].sort((a, b) => {
    const diff = STATUS_SORT_ORDER[getStatus(a.id)] - STATUS_SORT_ORDER[getStatus(b.id)];
    if (diff !== 0) return diff;
    return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
  });
}

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const { challenges, setChallenges, setIsLoading } = useAppStore();

  const [boards, setBoards] = useState<HomeBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [boardsLoaded, setBoardsLoaded] = useState(false);
  const [startingBoardPlay, setStartingBoardPlay] = useState(false);
  const [completedBoardIds, setCompletedBoardIds] = useState<string[]>([]);
  const [boardDetailOpen, setBoardDetailOpen] = useState(false);
  const boardCache = useRef<Record<string, Challenge[]>>({});
  const boardCompletedCache = useRef<Record<string, boolean>>({});
  const boardCompletionRequestCache = useRef<Record<string, Promise<boolean>>>({});
  const activeBoardIdRef = useRef<string | null>(null);
  const initialBoardSelectionApplied = useRef(false);
  activeBoardIdRef.current = activeBoardId;

  const boardOrderIndex = useMemo(
    () => new Map(boards.map((b, i) => [b.id, i])),
    [boards]
  );

  const getBoardPlayStatus = useCallback(
    (boardId: string): BoardPlayStatus => {
      if (completedBoardIds.includes(boardId)) return 'completed';
      if (boardCompletedCache.current[boardId] === true) return 'completed';

      const cached = boardCache.current[boardId];
      if (!cached || cached.length === 0) return 'unknown';

      const allCompleted = cached.every((c) => c.status === ChallengeStatus.COMPLETED);
      if (allCompleted) return 'completed';

      const allNotStarted = cached.every((c) => isChallengeNotStarted(c.status));
      if (allNotStarted) return 'not_started';

      return 'in_progress';
    },
    [completedBoardIds]
  );

  const playLocked = useMemo(() => {
    if (!activeBoardId || challenges.length === 0) return false;
    const sameBoard = challenges.every((c) => !c.boardId || c.boardId === activeBoardId);
    if (!sameBoard) return false;
    return challenges.every((c) => isChallengeNotStarted(c.status));
  }, [challenges, activeBoardId]);

  // Fetch boards list on mount
  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoadingBoard(true);
    setBoardsLoaded(false);
    fetch('/api/boards')
      .then((r) => r.json())
      .then((data: HomeBoard[]) => {
        setBoards(data);
        if (data.length > 0) {
          setActiveBoardId(data[0].id);
          return;
        }
        setActiveBoardId(null);
        setChallenges([]);
      })
      .catch((err) => {
        console.error(err);
        setActiveBoardId(null);
        setChallenges([]);
      })
      .finally(() => {
        setLoadingBoard(false);
        setBoardsLoaded(true);
      });
  }, [status, setChallenges]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoadingBoard(false);
      router.replace('/login');
    }
  }, [status, router]);

  const incompleteBoards = useMemo(
    () => boards.filter((b) => !completedBoardIds.includes(b.id)),
    [boards, completedBoardIds]
  );

  const completedBoardsList = useMemo(
    () => boards.filter((b) => completedBoardIds.includes(b.id)),
    [boards, completedBoardIds]
  );

  const orderedIncompleteBoards = useMemo(
    () => sortBoardsByPlayStatus(incompleteBoards, getBoardPlayStatus, boardOrderIndex),
    [incompleteBoards, getBoardPlayStatus, boardOrderIndex]
  );

  const upcomingBoards = useMemo(
    () => orderedIncompleteBoards.filter((b) => b.id !== activeBoardId),
    [orderedIncompleteBoards, activeBoardId]
  );

  useEffect(() => {
    if (!activeBoardId) return;
    if (challenges.length === 0) return;
    const isCompleted = challenges.every(
      (c) => c.status === ChallengeStatus.COMPLETED
    );
    boardCompletedCache.current[activeBoardId] = isCompleted;

    if (isCompleted) {
      setCompletedBoardIds((prev) => {
        if (prev.includes(activeBoardId)) return prev;
        const nextBoard = boards.find(
          (b) => b.id !== activeBoardId && !prev.includes(b.id)
        );
        if (nextBoard) {
          queueMicrotask(() => setActiveBoardId(nextBoard.id));
        }
        return [...prev, activeBoardId];
      });
      return;
    }

    setCompletedBoardIds((prev) => {
      if (!prev.includes(activeBoardId)) return prev;
      return prev.filter((id) => id !== activeBoardId);
    });
  }, [activeBoardId, challenges, boards]);

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

  // On first load, if the default board is already completed, switch to first incomplete
  useEffect(() => {
    if (!boardsLoaded || boards.length === 0 || initialBoardSelectionApplied.current) return;
    if (completedBoardIds.length === 0) return;
    initialBoardSelectionApplied.current = true;
    if (!activeBoardId || !completedBoardIds.includes(activeBoardId)) return;
    const next = orderedIncompleteBoards[0];
    if (next) setActiveBoardId(next.id);
  }, [
    boardsLoaded,
    boards.length,
    activeBoardId,
    completedBoardIds,
    orderedIncompleteBoards,
  ]);

  // Fetch challenges for active board
  useEffect(() => {
    if (!activeBoardId || status !== 'authenticated') return;

    const boardIdForRequest = activeBoardId;
    let cancelled = false;

    setIsLoading(true);

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
    if (!activeBoardId || orderedIncompleteBoards.length === 0) return;

    const currentIdx = orderedIncompleteBoards.findIndex((b) => b.id === activeBoardId);
    const afterCurrent = orderedIncompleteBoards.slice(currentIdx + 1);
    const beforeCurrent =
      currentIdx >= 0 ? orderedIncompleteBoards.slice(0, currentIdx) : orderedIncompleteBoards;

    const next = afterCurrent[0] ?? beforeCurrent[0];
    if (next && next.id !== activeBoardId) {
      setActiveBoardId(next.id);
    }
  }, [activeBoardId, orderedIncompleteBoards]);

  const switchBoard = useCallback((boardId: string) => {
    if (boardId === activeBoardId) return;
    setActiveBoardId(boardId);
  }, [activeBoardId]);

  useEffect(() => {
    setBoardDetailOpen(false);
  }, [activeBoardId]);

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    (status === 'authenticated' && (!boardsLoaded || (loadingBoard && !!activeBoardId)))
  ) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const hasBoards = boards.length > 0;
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const showEmptyState = hasBoards && !activeBoard;
  const showNoActiveBoards = !hasBoards;
  const activeBoardCompleted =
    !!activeBoardId && completedBoardIds.includes(activeBoardId);
  const activeBoardStatus: BoardPlayStatus = activeBoardId
    ? getBoardPlayStatus(activeBoardId)
    : 'unknown';
  const activeBoardStatusLabel =
    activeBoardStatus === 'completed'
      ? 'Completado'
      : activeBoardStatus === 'in_progress'
        ? 'En curso'
        : 'Nuevo';

  return (
    <Layout brandLogoSrc="/images/box-challenge-logo.png" brandLogoAlt="Box Challenge">
      <div className="min-h-full pb-8">
        <div className="pt-1 pb-0" style={{ paddingLeft: '8.53%', paddingRight: 17 }}>
          <div className="flex items-center justify-between">
            <h1 className="text-white font-semibold text-xl tracking-tight">
              Retos
            </h1>
            {activeBoard && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-secondary-400 font-medium max-w-[175px] truncate">
                  {activeBoard.emoji} {activeBoard.title}
                </span>
                <button
                  type="button"
                  onClick={() => setBoardDetailOpen(true)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Ver descripción del tablero"
                  title="Ver descripción del tablero"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {showNoActiveBoards ? (
          <div className="w-full flex justify-center mt-8 px-6">
            <div className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-5 text-center" style={{ maxWidth: 360 }}>
              <p className="text-sm font-semibold text-white">No hay tableros disponibles</p>
              <p className="text-xs text-slate-500 mt-1">
                Puede que aún no tengas acceso a retos de tu empresa, o que no haya tableros activos.
                Si acabas de registrarte, confirma que usaste el enlace de invitación de tu organización.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : showEmptyState ? (
          <div className="w-full flex justify-center mt-8 px-6">
            <div className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-5 text-center" style={{ maxWidth: 360 }}>
              <p className="text-sm font-semibold text-white">No se pudo seleccionar un tablero</p>
              <p className="text-xs text-slate-500 mt-1">
                Actualiza la página para volver a cargar tus retos.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Recargar
              </button>
            </div>
          </div>
        ) : (
          <>
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

            <div className="w-full flex justify-center mt-4 px-6">
              <div className="w-full" style={{ maxWidth: 326 }}>
                <CompletionBar challenges={challenges} />
              </div>
            </div>

            {upcomingBoards.length > 0 && (
              <div className="w-full flex justify-center mt-6 px-6">
                <div className="w-full space-y-3" style={{ maxWidth: 326 }}>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">Próximos tableros</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Empieza por los que aún no has iniciado
                      {upcomingBoards.length > 1
                        ? ` · ${upcomingBoards.length} disponibles`
                        : ''}
                    </p>
                  </div>
                  <BoardThumbnailGrid
                    boards={upcomingBoards}
                    activeBoardId={activeBoardId}
                    getBoardPlayStatus={getBoardPlayStatus}
                    onSelect={switchBoard}
                  />
                </div>
              </div>
            )}

            {completedBoardsList.length > 0 && (
              <div className="w-full flex justify-center mt-6 px-6">
                <div className="w-full space-y-3" style={{ maxWidth: 326 }}>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Tableros completados ({completedBoardsList.length})
                  </h2>
                  <BoardThumbnailGrid
                    boards={completedBoardsList}
                    activeBoardId={activeBoardCompleted ? activeBoardId : null}
                    getBoardPlayStatus={() => 'completed'}
                    onSelect={switchBoard}
                    showStatusChip={false}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div className="w-full flex justify-center mt-6 px-6">
          <div className="w-full" style={{ maxWidth: 326 }}>
            <InfoAccordion />
          </div>
        </div>

        <BoardDetailSheet
          board={activeBoard ?? null}
          open={boardDetailOpen}
          onClose={() => setBoardDetailOpen(false)}
          statusLabel={activeBoardStatusLabel}
          completedChallenges={challenges.filter((c) => c.status === ChallengeStatus.COMPLETED).length}
          totalChallenges={challenges.length}
        />
      </div>
    </Layout>
  );
}

function BoardThumbnailGrid({
  boards,
  activeBoardId,
  getBoardPlayStatus,
  onSelect,
  showStatusChip = true,
}: {
  boards: HomeBoard[];
  activeBoardId: string | null;
  getBoardPlayStatus: (boardId: string) => BoardPlayStatus;
  onSelect: (boardId: string) => void;
  showStatusChip?: boolean;
}) {
  return (
    <div className="w-full grid grid-cols-3 gap-3">
      {boards.map((board) => {
        const selected = board.id === activeBoardId;
        const playStatus = getBoardPlayStatus(board.id);
        const statusLabel =
          playStatus === 'not_started'
            ? 'Nuevo'
            : playStatus === 'in_progress' || playStatus === 'unknown'
              ? 'En curso'
              : null;

        return (
          <button
            key={board.id}
            type="button"
            onClick={() => onSelect(board.id)}
            aria-pressed={selected}
            className={`rounded-xl overflow-hidden border transition-all text-left ${
              selected
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-slate-700 hover:border-primary-500/40'
            }`}
          >
            <div className="relative aspect-square bg-slate-800">
              {board.coverImage ? (
                <img
                  src={resolveMediaUrl(board.coverImage) ?? board.coverImage}
                  alt={board.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-2xl"
                  style={{ background: `${board.color}22` }}
                >
                  {board.emoji || '■'}
                </div>
              )}
              {showStatusChip && statusLabel && (
                <span
                  className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                    playStatus === 'not_started'
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-900/80 text-slate-300'
                  }`}
                >
                  {statusLabel}
                </span>
              )}
            </div>
            <div className="px-2 py-1.5 bg-slate-800 border-t border-slate-700">
              <p className="text-[10px] font-semibold text-white truncate leading-tight">
                {board.emoji} {board.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CompletionBar({ challenges }: { challenges: Challenge[] }) {
  const completed = challenges.filter((c) => c.status === ChallengeStatus.COMPLETED).length;
  const total = challenges.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">
          {completed} / {total} retos completados
        </span>
        <span className="text-xs font-semibold text-primary-500">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
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
