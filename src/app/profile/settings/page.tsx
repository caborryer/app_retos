'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession, signOut } from 'next-auth/react';

type ProfileResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: 'USER' | 'ADMIN';
  };
  notifications: {
    notificationsEnabled: boolean;
    activityReminders: boolean;
    marketingEmails: boolean;
  };
};

export default function ProfileSettingsPage() {
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

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile', { credentials: 'include' });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo cargar la configuración.');
      }
      setData(body as ProfileResponse);
      setNameInput((body as ProfileResponse).user.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    if (status === 'authenticated') void loadProfile();
  }, [status]);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push('/login');
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
    setSavingNotifications(true);
    setError(null);
    try {
      await patchProfile({
        notifications: {
          [field]: !data.notifications[field],
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar preferencias.');
    } finally {
      setSavingNotifications(false);
    }
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    setUpdatingAvatar(true);
    setError(null);
    setFeedback(null);
    try {
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
        throw new Error(
          typeof uploadBody.error === 'string' ? uploadBody.error : 'No se pudo subir la imagen.'
        );
      }
      await patchProfile({ avatar: uploadBody.url });
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
      <Layout title="Configuración" showBack>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!session?.user || !data) {
    return (
      <Layout title="Configuración" showBack>
        <Card variant="bordered" className="p-5">
          <p className="text-sm text-secondary-700 mb-3">
            No pudimos cargar tu configuración.
          </p>
          <Button onClick={() => void loadProfile()}>Reintentar</Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Configuración" showBack>
      <div className="space-y-4">
        <Card variant="elevated" className="p-5 space-y-4">
          <h3 className="font-semibold text-secondary-900">Perfil</h3>
          <div className="flex items-center gap-3">
            {data.user.avatar ? (
              <img src={data.user.avatar} alt={data.user.name} className="w-16 h-16 rounded-full object-cover border border-secondary-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center text-2xl">👤</div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={updatingAvatar}
              >
                Cambiar foto
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void handleRemoveAvatar()} disabled={updatingAvatar || !data.user.avatar}>
                Eliminar
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <label className="block">
            <span className="text-xs text-secondary-600">Nombre visible</span>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm"
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
          <Button onClick={() => void handleSaveName()} disabled={savingName}>Guardar cambios</Button>
        </Card>

        <Card variant="elevated" className="p-5 space-y-4">
          <h3 className="font-semibold text-secondary-900">Seguridad</h3>
          <label className="block">
            <span className="text-xs text-secondary-600">Contraseña actual</span>
            <input type="password" value={passwordCurrent} onChange={(e) => setPasswordCurrent(e.target.value)} className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-secondary-600">Nueva contraseña</span>
            <input type="password" value={passwordNext} onChange={(e) => setPasswordNext(e.target.value)} className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm" />
          </label>
          <Button onClick={() => void handleChangePassword()} disabled={changingPassword}>Cambiar contraseña</Button>
        </Card>

        <Card variant="elevated" className="p-5 space-y-3">
          <h3 className="font-semibold text-secondary-900">Notificaciones</h3>
          {[
            { key: 'notificationsEnabled', label: 'Notificaciones en la app' },
            { key: 'activityReminders', label: 'Recordatorios de actividad' },
            { key: 'marketingEmails', label: 'Emails informativos' },
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

        <Card variant="elevated" className="p-5 space-y-4">
          <h3 className="font-semibold text-secondary-900">Cuenta</h3>
          <p className="text-xs text-secondary-500">
            Para eliminar tu cuenta escribe <strong>ELIMINAR</strong>. Esta accion no se puede deshacer.
          </p>
          <input
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            className="w-full rounded-xl border border-secondary-200 px-3 py-2 text-sm"
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
          <Button variant="ghost" className="w-full text-error" leftIcon={<LogOut className="w-5 h-5" />} onClick={handleLogout}>
            Cerrar Sesion
          </Button>
        </Card>

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
      </div>
    </Layout>
  );
}

