'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, Award } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function ActivityPage() {
  const ready = useAuthGuard();
  const { activeChallenges, completedChallenges } = useAppStore();

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
                  {activeChallenges.length}
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
                  {completedChallenges.length}
                </div>
                <div className="text-xs text-secondary-600">Completados</div>
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
                <span className="text-4xl font-bold">12</span>
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
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-secondary-900">
            Actividad Reciente
          </h2>

          <div className="space-y-3">
            {/* Sample activities */}
            {[
              {
                id: '1',
                type: 'complete',
                title: 'Completaste "30 Días de Running"',
                time: new Date(Date.now() - 1000 * 60 * 30),
                icon: '🏃',
                color: 'bg-green-100 text-green-600',
              },
              {
                id: '2',
                type: 'badge',
                title: 'Ganaste la insignia "Corredor Inicial"',
                time: new Date(Date.now() - 1000 * 60 * 60 * 2),
                icon: '🏅',
                color: 'bg-yellow-100 text-yellow-600',
              },
              {
                id: '3',
                type: 'start',
                title: 'Comenzaste "Desafío de Flexiones"',
                time: new Date(Date.now() - 1000 * 60 * 60 * 24),
                icon: '💪',
                color: 'bg-primary-100 text-primary-600',
              },
            ].map((activity, idx) => (
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
                        {formatRelativeTime(activity.time)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty State for no activity */}
        {activeChallenges.length === 0 && completedChallenges.length === 0 && (
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

