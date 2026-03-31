'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFormState, useFormStatus } from 'react-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { credentialsSignInAction } from '@/app/actions/credentials-sign-in';

function AdminSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Ingresando...
        </>
      ) : (
        'Acceder al panel'
      )}
    </button>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction] = useFormState(credentialsSignInAction, undefined);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="intent" value="admin" />

          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue="admin@sport.com"
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
                name="password"
                type={showPassword ? 'text' : 'password'}
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

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          <AdminSubmitButton />
        </form>

        <p className="text-center text-slate-500 text-xs">
          ¿Usuario regular?{' '}
          <button type="button" onClick={() => router.push('/login')} className="text-primary-400 hover:text-primary-300">
            Ir al login normal
          </button>
        </p>
      </div>
    </div>
  );
}
