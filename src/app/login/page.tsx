'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';
import PublicBrandNav from '@/components/brand/PublicBrandNav';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [sessionCheckTimedOut, setSessionCheckTimedOut] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      window.location.assign(session.user.role === 'ADMIN' ? '/admin' : '/home');
    }
  }, [status, session]);

  useEffect(() => {
    if (status !== 'loading') {
      setSessionCheckTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setSessionCheckTimedOut(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setResendMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.error ?? 'Demasiados intentos. Espera unos minutos.');
        return;
      }

      if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
        setError(data.error ?? 'Confirma tu email antes de entrar.');
        return;
      }

      if (!res.ok && !data.mfaRequired) {
        setError(data.error ?? 'Credenciales incorrectas.');
        return;
      }

      if (data.mfaRequired) {
        window.location.assign('/login/mfa');
        return;
      }

      if (!data.sessionToken) {
        setError('No se pudo iniciar sesión.');
        return;
      }

      const result = await signIn('credentials', {
        flow: 'session_token',
        loginToken: data.sessionToken,
        redirect: false,
      });

      if (result?.ok) {
        const dest = data.role === 'ADMIN' ? '/admin' : '/home';
        window.location.assign(dest);
        return;
      }

      setError('No se pudo completar el inicio de sesión.');
    } catch {
      setError('No se pudo conectar al servicio de autenticación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all bg-slate-800';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <PublicBrandNav />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Iniciar sesión</h1>
            <p className="text-slate-400 text-sm mt-1">Accede a tu tablero de retos</p>
            {status === 'loading' && (
              <p className="text-[11px] text-slate-500 mt-2">
                {sessionCheckTimedOut
                  ? 'La verificación de sesión está tardando. Puedes iniciar sesión manualmente.'
                  : 'Verificando sesión...'}
              </p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <GoogleSignInButton label="Continuar con Google" callbackUrl="/" />
            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500 shrink-0">o con email</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm space-y-2">
                <p>{error}</p>
                {emailNotVerified && (
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={async () => {
                      setResendLoading(true);
                      setResendMessage('');
                      try {
                        const res = await fetch('/api/auth/resend-verification', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: email.trim() }),
                        });
                        const body = await res.json();
                        setResendMessage(
                          res.ok
                            ? 'Si la cuenta no está verificada, te enviamos un nuevo correo.'
                            : (body.error ?? 'No se pudo reenviar.')
                        );
                        if (body.devLink) console.info('[dev] verification link:', body.devLink);
                      } catch {
                        setResendMessage('Error de conexión.');
                      } finally {
                        setResendLoading(false);
                      }
                    }}
                    className="text-primary-400 text-xs font-medium hover:underline disabled:opacity-60"
                  >
                    {resendLoading ? 'Enviando…' : 'Reenviar correo de verificación'}
                  </button>
                )}
                {resendMessage && <p className="text-xs text-slate-400">{resendMessage}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm transition-all hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <BoxChallengeLoader size="xs" compact showGlow={false} />
                  Ingresando...
                </>
              ) : (
                'Entrar al tablero →'
              )}
            </button>

            <p className="text-center text-sm text-slate-500 pt-1">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-primary-400 font-medium hover:text-primary-300 transition-colors">
                Regístrate aquí
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
