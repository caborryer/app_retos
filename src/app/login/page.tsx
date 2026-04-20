'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      window.location.assign(session.user.role === 'ADMIN' ? '/admin' : '/home');
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="w-8 h-8 border-4 border-[#FC0230] border-t-transparent rounded-full animate-spin" />
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
        callbackUrl: '/home',
      });

      // Temporary debug — remove after login is stable
      console.debug('[login] signIn result:', JSON.stringify(result));

      if (!result) {
        setError('Sin respuesta del servidor. Intenta nuevamente.');
        return;
      }

      if (result.ok) {
        window.location.assign('/home');
        return;
      }

      setError(
        result.error === 'CredentialsSignin'
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : `Error al iniciar sesión (${result.error ?? 'desconocido'}). Intenta nuevamente.`,
      );
    } catch (err) {
      console.error('[login] signIn threw:', err);
      setError('No se pudo conectar al servicio de autenticación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
      className="bg-[#FAFAF9] flex flex-col"
    >
      <nav className="flex items-center justify-between px-6 h-[60px] border-b border-[#EEECEA] bg-[#FAFAF9] sticky top-0 z-10">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#1C1C1A] font-bold text-[15px] tracking-tight"
        >
          <div className="w-7 h-7 rounded-lg bg-[#FC0230] flex items-center justify-center">
            <span className="text-sm">🏆</span>
          </div>
          SportBingo
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1C1C1A] tracking-tight">Iniciar sesión</h1>
            <p className="text-[#6B6B67] text-sm mt-1">Accede a tu tablero de retos</p>
          </div>

          <div className="space-y-4 mb-6">
            <GoogleSignInButton label="Continuar con Google" callbackUrl="/" />
            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E3DC]" />
              <span className="text-xs text-[#9B9B95] shrink-0">o con email</span>
              <div className="h-px flex-1 bg-[#E5E3DC]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#444441] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="w-full border border-[#E5E3DC] rounded-xl pl-10 pr-4 py-3 text-[#1C1C1A] placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#444441] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-[#E5E3DC] rounded-xl pl-10 pr-11 py-3 text-[#1C1C1A] placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B6AF] hover:text-[#444441] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#FC0230' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Entrar al tablero →'
              )}
            </button>

            <p className="text-center text-sm text-[#9B9B95] pt-1">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-[#FC0230] font-medium hover:opacity-80 transition-opacity">
                Regístrate aquí
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
