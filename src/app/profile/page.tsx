'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronDown, LogOut, ShieldCheck, Trash2, Trophy } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import { useSession, signOut } from 'next-auth/react';
import { formatRelativeTime } from '@/lib/utils';

type ProfileResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: 'USER' | 'ADMIN';
  };
  metrics: {
    points: number;
    level: number;
    levelProgress: number;
    pointsToNextLevel: number;
    activeChallenges: number;
    completedChallenges: number;
    completedBoards: number;
    streakDays: number;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      unlocked: boolean;
      progress: number;
      target: number;
    }>;
  };
  notifications: {
    notificationsEnabled: boolean;
    activityReminders: boolean;
    marketingEmails: boolean;
  };
  recentCompletedChallenges: Array<{
    id: string;
    title: string;
    icon: string;
    completedAt: string | null;
  }>;
  activeChallenges: Array<{
    id: string;
    title: string;
    icon: string;
  }>;
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNext, setPasswordNext] = useState('');
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openSection, setOpenSection] = useState<
    'badges' | 'profile' | 'security' | 'notifications' | 'completed' | 'active' | 'account'
  >('profile');

  function toggleSection(
    id: 'badges' | 'profile' | 'security' | 'notifications' | 'completed' | 'active' | 'account'
  ) {
    setOpenSection(id);
  }

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile', { credentials: 'include' });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo cargar el perfil.');
      }
      setData(body as ProfileResponse);
      setNameInput((body as ProfileResponse).user.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push('/login');
  }

  useEffect(() => {
    if (status === 'authenticated') {
      void loadProfile();
    }
  }, [status]);

  async function patchProfile(payload: Record<string, unknown>) {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo guardar.');
    }
    setData(body as ProfileResponse);
    return body as ProfileResponse;
  }

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    setError(null);
    setFeedback(null);
    try {
      await patchProfile({ name: nameInput.trim() });
      setFeedback('Nombre actualizado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el nombre.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleToggleNotification(
    field: 'notificationsEnabled' | 'activityReminders' | 'marketingEmails'
  ) {
    if (!data) return;
    const nextValue = !data.notifications[field];
    setSavingNotifications(true);
    setError(null);
    try {
      await patchProfile({
        notifications: {
          [field]: nextValue,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar preferencias.');
    } finally {
      setSavingNotifications(false);
    }
  }

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'avatars');
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const uploadBody = await uploadRes.json();
    if (!uploadRes.ok || typeof uploadBody.url !== 'string') {
      throw new Error(typeof uploadBody.error === 'string' ? uploadBody.error : 'No se pudo subir la imagen.');
    }
    await patchProfile({ avatar: uploadBody.url });
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    setUpdatingAvatar(true);
    setError(null);
    setFeedback(null);
    try {
      await uploadAvatar(file);
      setFeedback('Foto de perfil actualizada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la foto.');
    } finally {
      setUpdatingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setUpdatingAvatar(true);
    setError(null);
    setFeedback(null);
    try {
      await patchProfile({ removeAvatar: true });
      setFeedback('Foto de perfil eliminada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la foto.');
    } finally {
      setUpdatingAvatar(false);
    }
  }

  async function handleChangePassword() {
    setChangingPassword(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordCurrent,
          newPassword: passwordNext,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo cambiar la contraseña.');
      }
      setPasswordCurrent('');
      setPasswordNext('');
      setFeedback('Contraseña actualizada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setError(null);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmText: confirmDeleteText }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo eliminar la cuenta.');
      }
      await signOut({ redirect: false });
      router.push('/register');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.');
    } finally {
      setDeletingAccount(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Perfil">
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const user = session?.user;
  if (!user) return null;
  if (!data) {
    return (
      <Layout title="Perfil">
        <div className="space-y-4">
          <Card variant="bordered" className="p-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-2">
              No pudimos cargar tu perfil
            </h2>
            <p className="text-sm text-secondary-600">
              {error ?? 'Ocurrió un problema al cargar los datos del perfil.'}
            </p>
            <div className="mt-4">
              <Button onClick={() => void loadProfile()}>
                Reintentar
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }
  const unlockedBadges = data.metrics.badges.filter((b) => b.unlocked).length;

  return (
    <Layout title="Perfil">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card variant="gradient" className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {data.user.avatar ? (
              <img
                src={data.user.avatar}
                alt={data.user.name}
                className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-3xl">
                👤
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {data.user.name}
              </h2>
              <p className="text-white/80 text-sm">
                {data.user.email}
              </p>
              {data.user.role === 'ADMIN' && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              leftIcon={<Camera className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
              disabled={updatingAvatar}
            >
              Foto
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Level Progress */}
          <div className="bg-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">
                Nivel {data.metrics.level}
              </span>
              <span className="text-white text-sm">
                {data.metrics.pointsToNextLevel} puntos para nivel {data.metrics.level + 1}
              </span>
            </div>
            <ProgressBar
              value={data.metrics.levelProgress}
              variant="success"
              size="md"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleRemoveAvatar()}
              className="text-xs text-white/90 underline underline-offset-2 disabled:opacity-50"
              disabled={updatingAvatar || !data.user.avatar}
            >
              Eliminar foto
            </button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">
              {data.metrics.points}
            </div>
            <div className="text-xs text-secondary-600">Puntos</div>
          </Card>

          <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500 mb-1">
              {data.metrics.completedChallenges}
            </div>
            <div className="text-xs text-secondary-600">Retos completados</div>
          </Card>

          <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-indigo-500 mb-1">
              {data.metrics.completedBoards}
            </div>
            <div className="text-xs text-secondary-600">Tableros completados</div>
          </Card>

          <Card variant="elevated" className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">
              {unlockedBadges}
            </div>
            <div className="text-xs text-secondary-600">Insignias</div>
          </Card>
        </div>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-secondary-900">Configuración de la cuenta</p>
              <p className="text-xs text-secondary-600 mt-1">
                Edita perfil, seguridad, notificaciones y cuenta en una pantalla dedicada.
              </p>
            </div>
            <Button size="sm" onClick={() => router.push('/profile/settings')}>
              Abrir
            </Button>
          </div>
        </Card>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('badges')}
            aria-expanded={openSection === 'badges'}
            aria-controls="profile-section-badges"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary-500" />
              Insignias y progreso
            </span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'badges' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'badges' && (
            <Card id="profile-section-badges" variant="elevated" className="p-5 mt-2">
              <div className="space-y-3">
                {data.metrics.badges.map((badge) => (
                  <div key={badge.id} className="rounded-xl border border-secondary-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-secondary-900">
                          {badge.icon} {badge.name}
                        </p>
                        <p className="text-xs text-secondary-600 mt-1">{badge.description}</p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          badge.unlocked
                            ? 'bg-green-100 text-green-700'
                            : 'bg-secondary-100 text-secondary-600'
                        }`}
                      >
                        {badge.unlocked ? 'Obtenida' : `${badge.progress}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('profile')}
            aria-expanded={openSection === 'profile'}
            aria-controls="profile-section-data"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900">Datos del perfil</span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'profile' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'profile' && (
            <Card id="profile-section-data" variant="elevated" className="p-5 space-y-4 mt-2">
              <label className="block">
                <span className="text-xs text-secondary-600">Nombre visible</span>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </label>
              <label className="block">
                <span className="text-xs text-secondary-600">Email</span>
                <input
                  disabled
                  value={data.user.email}
                  className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm bg-secondary-50 text-secondary-500"
                />
              </label>
              <Button onClick={() => void handleSaveName()} disabled={savingName}>
                Guardar cambios
              </Button>
            </Card>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('security')}
            aria-expanded={openSection === 'security'}
            aria-controls="profile-section-security"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900">Seguridad</span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'security' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'security' && (
            <Card id="profile-section-security" variant="elevated" className="p-5 space-y-4 mt-2">
              <label className="block">
                <span className="text-xs text-secondary-600">Contraseña actual</span>
                <input
                  type="password"
                  value={passwordCurrent}
                  onChange={(e) => setPasswordCurrent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </label>
              <label className="block">
                <span className="text-xs text-secondary-600">Nueva contraseña</span>
                <input
                  type="password"
                  value={passwordNext}
                  onChange={(e) => setPasswordNext(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </label>
              <Button onClick={() => void handleChangePassword()} disabled={changingPassword}>
                Cambiar contraseña
              </Button>
            </Card>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('notifications')}
            aria-expanded={openSection === 'notifications'}
            aria-controls="profile-section-notifications"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900">Notificaciones</span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'notifications' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'notifications' && (
            <Card id="profile-section-notifications" variant="elevated" className="p-5 space-y-3 mt-2">
              {[
                {
                  key: 'notificationsEnabled',
                  label: 'Notificaciones en la app',
                },
                {
                  key: 'activityReminders',
                  label: 'Recordatorios de actividad',
                },
                {
                  key: 'marketingEmails',
                  label: 'Emails informativos',
                },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between py-1">
                  <span className="text-sm text-secondary-700">{item.label}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary-500"
                    checked={Boolean(data.notifications[item.key as keyof typeof data.notifications])}
                    onChange={() =>
                      void handleToggleNotification(
                        item.key as 'notificationsEnabled' | 'activityReminders' | 'marketingEmails'
                      )
                    }
                    disabled={savingNotifications}
                  />
                </label>
              ))}
            </Card>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('completed')}
            aria-expanded={openSection === 'completed'}
            aria-controls="profile-section-completed"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900">Retos completados</span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'completed' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'completed' && (
            <Card id="profile-section-completed" variant="elevated" className="p-5 space-y-3 mt-2">
              {data.recentCompletedChallenges.length === 0 ? (
                <p className="text-sm text-secondary-600">Aun no has completado retos.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentCompletedChallenges.map((item) => (
                    <div key={item.id} className="rounded-lg border border-secondary-100 px-3 py-2">
                      <p className="text-sm font-medium text-secondary-800">
                        {item.icon} {item.title}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {item.completedAt
                          ? formatRelativeTime(new Date(item.completedAt))
                          : 'Completado recientemente'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('active')}
            aria-expanded={openSection === 'active'}
            aria-controls="profile-section-active"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900">Retos activos</span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'active' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'active' && (
            <Card id="profile-section-active" variant="elevated" className="p-5 space-y-3 mt-2">
              {data.activeChallenges.length === 0 ? (
                <p className="text-sm text-secondary-600">No tienes retos activos en este momento.</p>
              ) : (
                <div className="space-y-2">
                  {data.activeChallenges.map((item) => (
                    <div key={item.id} className="rounded-lg border border-secondary-100 px-3 py-2">
                      <p className="text-sm font-medium text-secondary-800">
                        {item.icon} {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection('account')}
            aria-expanded={openSection === 'account'}
            aria-controls="profile-section-account"
            className="w-full flex items-center justify-between rounded-xl border border-secondary-200 bg-white px-4 py-3 text-left"
          >
            <span className="font-semibold text-secondary-900">Cuenta</span>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${openSection === 'account' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'account' && (
            <Card id="profile-section-account" variant="elevated" className="p-5 space-y-4 mt-2">
              <p className="text-xs text-secondary-500">
                Para eliminar tu cuenta escribe <strong>ELIMINAR</strong>. Esta accion no se puede deshacer.
              </p>
              <input
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-error/20"
                placeholder="Escribe ELIMINAR"
              />
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount}
                className="w-full rounded-xl border border-error/40 text-error py-2 text-sm font-medium hover:bg-error/5 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Eliminar cuenta
                </span>
              </button>
              <Button
                variant="ghost"
                className="w-full text-error"
                leftIcon={<LogOut className="w-5 h-5" />}
                onClick={handleLogout}
              >
                Cerrar Sesion
              </Button>
            </Card>
          )}
        </section>

        {feedback && (
          <Card variant="bordered" className="p-3 text-sm text-green-700 border-green-200 bg-green-50">
            {feedback}
          </Card>
        )}
        {error && (
          <Card variant="bordered" className="p-3 text-sm text-error border-error/40 bg-error/5">
            {error}
          </Card>
        )}

        {data.user.role === 'ADMIN' && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-medium text-sm hover:bg-primary-100 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            Ir al Panel Admin
          </button>
        )}

        {/* App Version */}
        <p className="text-center text-xs text-secondary-400 pb-6">
          BingoChallenge v1.0.0
        </p>
      </div>
    </Layout>
  );
}

