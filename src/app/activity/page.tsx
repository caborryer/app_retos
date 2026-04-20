'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { formatRelativeTime } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/useAuthGuard';

type ActivityStatResponse = {
  stats: {
    activeChallenges: number;
    completedChallenges: number;
    completedBoards: number;
    streakDays: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'start' | 'complete' | 'submission';
    title: string;
    icon: string;
    color: string;
    time: string;
  }>;
  boardRanking: null | {
    boardId: string;
    boardTitle: string;
    boardEmoji: string;
    yourPosition: number;
    totalCompetitors: number;
    entries: Array<{
      userId: string;
      name: string;
      completedChallenges: number;
      earnedPoints: number;
      isCurrentUser: boolean;
    }>;
    trend: {
      direction: 'up' | 'down' | 'same' | 'new';
      delta: number;
    };
  };
  globalRanking: null | {
    boardId: string;
    boardTitle: string;
    boardEmoji: string;
    yourPosition: number;
    totalCompetitors: number;
    entries: Array<{
      userId: string;
      name: string;
      completedChallenges: number;
      earnedPoints: number;
      isCurrentUser: boolean;
    }>;
    trend: {
      direction: 'up' | 'down' | 'same' | 'new';
      delta: number;
    };
  };
};

export default function ActivityPage() {
  const ready = useAuthGuard();
  const { activeChallenges, completedChallenges } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<ActivityStatResponse | null>(null);
  const [rankingMode, setRankingMode] = useState<'board' | 'global'>('board');

  useEffect(() => {
    if (!ready) return;
    let mounted = true;

    setLoading(true);
    fetch('/api/user/activity', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('No se pudo cargar la actividad.');
        }
        return (await res.json()) as ActivityStatResponse;
      })
      .then((data) => {
        if (!mounted) return;
        setApiData(data);
      })
      .catch(() => {
        if (!mounted) return;
        setApiData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [ready]);

  const stats = useMemo(
    () => ({
      activeChallenges: apiData?.stats.activeChallenges ?? activeChallenges.length,
      completedChallenges: apiData?.stats.completedChallenges ?? completedChallenges.length,
      completedBoards: apiData?.stats.completedBoards ?? 0,
      streakDays: apiData?.stats.streakDays ?? 0,
    }),
    [apiData, activeChallenges.length, completedChallenges.length]
  );

  const recentActivity = apiData?.recentActivity ?? [];
  const boardRanking = apiData?.boardRanking ?? null;
  const globalRanking = apiData?.globalRanking ?? null;
  const activeRanking =
    rankingMode === 'global'
      ? (globalRanking ?? boardRanking)
      : (boardRanking ?? globalRanking);
  const trendInfo =
    activeRanking?.trend.direction === 'up'
      ? { text: `Subiste ${activeRanking.trend.delta} puesto${activeRanking.trend.delta !== 1 ? 's' : ''} vs hace 7 días`, className: 'text-green-600', icon: ArrowUpRight }
      : activeRanking?.trend.direction === 'down'
      ? { text: `Bajaste ${activeRanking.trend.delta} puesto${activeRanking.trend.delta !== 1 ? 's' : ''} vs hace 7 días`, className: 'text-red-600', icon: ArrowDownRight }
      : activeRanking?.trend.direction === 'same'
      ? { text: 'Sin cambios vs hace 7 días', className: 'text-secondary-600', icon: Minus }
      : { text: 'Nueva entrada en ranking', className: 'text-indigo-600', icon: TrendingUp };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout title="Actividad">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-900">
                  {stats.activeChallenges}
                </div>
                <div className="text-xs text-secondary-600">Retos Activos</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100">
                <Trophy className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-900">
                  {stats.completedChallenges}
                </div>
                <div className="text-xs text-secondary-600">Completados</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100">
                <Trophy className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-900">
                  {stats.completedBoards}
                </div>
                <div className="text-xs text-secondary-600">Tableros completados</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Streak Card */}
        <Card variant="gradient" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Racha Actual
              </h3>
              <p className="text-white/80 text-sm">
                ¡Sigue así! Cada día cuenta
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-white">
                <Flame className="w-8 h-8" />
                <span className="text-4xl font-bold">{stats.streakDays}</span>
              </div>
              <span className="text-xs text-white/80">días</span>
            </div>
          </div>
        </Card>

        {/* Recent Badges */}
        {/* {user && user.badges.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-500" />
              Insignias Recientes
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {user.badges.map((badge, idx) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card variant="elevated" hoverable className="p-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <h3 className="font-semibold text-secondary-900 text-sm mb-1">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-secondary-600 line-clamp-2 mb-2">
                        {badge.description}
                      </p>
                      <Badge
                        variant={
                          badge.rarity === 'legendary'
                            ? 'warning'
                            : badge.rarity === 'epic'
                            ? 'primary'
                            : badge.rarity === 'rare'
                            ? 'info'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {badge.rarity}
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )} */}

        {/* Recent Activity Timeline */}
        {activeRanking && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-secondary-900">
                Tu posición en el ranking
              </h2>
              <div className="inline-flex rounded-lg border border-secondary-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setRankingMode('board')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    rankingMode === 'board'
                      ? 'bg-primary-500 text-white'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
                >
                  Tablero
                </button>
                <button
                  type="button"
                  onClick={() => setRankingMode('global')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    rankingMode === 'global'
                      ? 'bg-primary-500 text-white'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
                >
                  Global
                </button>
              </div>
            </div>
            <Card variant="elevated" className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-xs text-secondary-500">Ranking actual</p>
                  <p className="font-semibold text-secondary-900 truncate">
                    {activeRanking.boardEmoji} {activeRanking.boardTitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary-500">Tu posición</p>
                  <p className="text-xl font-bold text-primary-600">
                    #{activeRanking.yourPosition}
                  </p>
                  <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium ${trendInfo.className}`}>
                    <trendInfo.icon className="w-3.5 h-3.5" />
                    <span>{trendInfo.text}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {activeRanking.entries.map((entry, idx) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                      entry.isCurrentUser ? 'bg-primary-50 border border-primary-200' : 'bg-secondary-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">
                        {idx + 1}. {entry.name}
                        {entry.isCurrentUser ? ' (Tú)' : ''}
                      </p>
                      <p className="text-[11px] text-secondary-600">
                        {entry.completedChallenges} retos completados
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-secondary-800">
                      {entry.earnedPoints} pts
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-secondary-500 mt-3">
                Compites con {activeRanking.totalCompetitors} jugador{activeRanking.totalCompetitors !== 1 ? 'es' : ''} en este ranking.
              </p>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-secondary-900">
            Actividad Reciente
          </h2>

          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card variant="elevated" className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                      <span className="text-xl">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-secondary-600 mt-1">
                        {formatRelativeTime(new Date(activity.time))}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {loading && (
          <Card variant="bordered" className="p-4 text-center text-sm text-secondary-600">
            Cargando actividad...
          </Card>
        )}

        {/* Empty State for no activity */}
        {!loading && recentActivity.length === 0 && stats.activeChallenges === 0 && stats.completedChallenges === 0 && (
          <Card variant="bordered" className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-secondary-900 mb-2">
              Sin actividad reciente
            </h3>
            <p className="text-sm text-secondary-600">
              Comienza un reto para ver tu progreso aquí
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

