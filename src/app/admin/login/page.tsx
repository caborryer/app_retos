'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('admin@sport.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      window.location.assign('/admin');
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setError('Sin respuesta del servidor. Intenta nuevamente.');
        return;
      }

      if (result.ok) {
        // Verify ADMIN role before navigating (session cookie is now set).
        try {
          const s = await fetch('/api/auth/session', { cache: 'no-store' }).then((r) => r.json());
          const role = s?.user?.role as string | undefined;
          if (role !== 'ADMIN') {
            setError('Tu cuenta no tiene permisos de administrador.');
            return;
          }
        } catch {
          // If the session fetch fails, still navigate — the admin layout will guard.
        }
        // Hard navigation — do NOT use result.url (it defaults to /admin/login).
        window.location.assign('/admin');
        return;
      }

      setError(
        result.error === 'CredentialsSignin'
          ? 'Credenciales incorrectas o sin permisos de administrador.'
          : 'No se pudo iniciar sesión. Intenta nuevamente.',
      );
    } catch {
      setError('No se pudo conectar al servicio de autenticación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold text-white">Panel Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Acceso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingresando...
              </>
            ) : (
              'Acceder al panel'
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs">
          ¿Usuario regular?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-primary-400 hover:text-primary-300"
          >
            Ir al login normal
          </button>
        </p>
      </div>
    </div>
  );
}
