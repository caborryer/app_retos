'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { calculateLevel, getLevelProgress } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);
  // Prefer currentUser (set by login), fall back to user (legacy mock)
  const currentUser = useAppStore((s) => s.currentUser);
  const legacyUser = useAppStore((s) => s.user);
  const user = currentUser ?? legacyUser;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      const { currentUser: cu, user: u } = useAppStore.getState();
      if (!cu && !u) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    };
    if (useAppStore.persist.hasHydrated()) check();
    else useAppStore.persist.onFinishHydration(check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const level = calculateLevel(user.points ?? 0);
  const levelProgress = getLevelProgress(user.points ?? 0);
  const pointsToNext = 200 - ((user.points ?? 0) % 200);

  return (
    <Layout title="Perfil">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card variant="gradient" className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-3xl">
                👤
              </div>
            )}
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {user.name}
              </h2>
              <p className="text-white/80 text-sm">
                {user.email}
              </p>
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">
                Nivel {level}
              </span>
              <span className="text-white text-sm">
                {pointsToNext} puntos para nivel {level + 1}
              </span>
            </div>
            <ProgressBar
              value={levelProgress}
              variant="success"
              size="md"
            />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">
              {formatNumber(user.points)}
            </div>
            <div className="text-xs text-secondary-600">Puntos</div>
          </Card> */}

          <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500 mb-1">
              {user.completedChallenges}
            </div>
            <div className="text-xs text-secondary-600">Completados</div>
          </Card>

          <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">
              {user.badges.length}
            </div>
            <div className="text-xs text-secondary-600">Insignias</div>
          </Card>
        </div>

        {/* Badges Collection */}
        {/* <div className="space-y-4">
          <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-500" />
            Mis Insignias ({user.badges.length})
          </h2>

          {user.badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {user.badges.map((badge, idx) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card variant="elevated" hoverable className="p-4 text-center">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h3 className="font-semibold text-xs text-secondary-900 line-clamp-1">
                      {badge.name}
                    </h3>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card variant="bordered" className="p-8 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-sm text-secondary-600">
                Completa retos para ganar insignias
              </p>
            </Card>
          )}
        </div> */}

        {/* Menu Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">
            Configuración
          </h3>

          <Card variant="elevated">
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-secondary-600" />
                <span className="font-medium text-secondary-900">
                  Configuración
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-secondary-400" />
            </button>

            <div className="border-t border-secondary-100" />

            {/* <button className="w-full flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-secondary-600" />
                <span className="font-medium text-secondary-900">
                  Mis Logros
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-secondary-400" />
            </button> */}

            <div className="border-t border-secondary-100" />

            {/* <button className="w-full flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-secondary-600" />
                <span className="font-medium text-secondary-900">
                  Calificar App
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-secondary-400" />
            </button> */}
          </Card>

          {user.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-medium text-sm hover:bg-primary-100 transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
              Ir al Panel Admin
            </button>
          )}

          <Button
            variant="ghost"
            className="w-full text-error"
            leftIcon={<LogOut className="w-5 h-5" />}
            onClick={handleLogout}
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-secondary-400 pb-6">
          BingoChallenge v1.0.0
        </p>
      </div>
    </Layout>
  );
}

