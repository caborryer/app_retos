'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail, User, X, Building2 } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import PublicBrandNav from '@/components/brand/PublicBrandNav';
import AppLoadingScreen from '@/components/brand/AppLoadingScreen';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';
import { INVITE_COOKIE_NAME, getInviteCookieMaxAgeSeconds } from '@/lib/invite-cookie';

// ─── T&C Modal ────────────────────────────────────────────────────────────────

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-bold text-white text-base">Términos y Condiciones</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-4 text-sm text-slate-300 leading-relaxed">
          <section>
            <h3 className="font-semibold text-white mb-1">1. Aceptación de los términos</h3>
            <p>Al registrarte en Bingo, aceptas cumplir y quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.</p>
          </section>
          <section>
            <h3 className="font-semibold text-white mb-1">2. Uso de la plataforma</h3>
            <p>Bingo es una plataforma de retos deportivos y de bienestar. Te comprometes a utilizar la plataforma de forma lícita y respetuosa, sin subir contenido falso, ofensivo o que infrinja derechos de terceros.</p>
          </section>
          <section>
            <h3 className="font-semibold text-white mb-1">3. Evidencias y validación</h3>
            <p>Las evidencias (fotos, enlaces de Strava u otros) que subas deben ser auténticas y corresponder a la actividad real realizada. El equipo organizador se reserva el derecho de rechazar evidencias que no cumplan los requisitos del reto.</p>
          </section>
          <section>
            <h3 className="font-semibold text-white mb-1">4. Privacidad de datos</h3>
            <p>Tus datos personales (nombre, email) se utilizan exclusivamente para gestionar tu cuenta y participación en los retos. No compartimos tu información con terceros sin tu consentimiento expreso, salvo obligación legal.</p>
          </section>
          <section>
            <h3 className="font-semibold text-white mb-1">5. Modificaciones</h3>
            <p>Bingo se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma y entrarán en vigor a los 7 días de su publicación.</p>
          </section>
          <section>
            <h3 className="font-semibold text-white mb-1">6. Contacto</h3>
            <p>Para cualquier consulta sobre estos términos, puedes contactarnos a través del panel de la aplicación.</p>
          </section>
        </div>
        <div className="px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#FC0230' }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function setInviteCookie(token: string) {
  const maxAge = getInviteCookieMaxAgeSeconds();
  document.cookie = `${INVITE_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite')?.trim() ?? '';
  const { status } = useSession();
  const signOutForInviteRef = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);
  const [sessionCheckTimedOut, setSessionCheckTimedOut] = useState(false);
  const [inviteValidating, setInviteValidating] = useState(!!inviteToken);
  const [inviteValid, setInviteValid] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'loading') {
      setSessionCheckTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setSessionCheckTimedOut(true), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  // Invite links are for new accounts: always clear any existing session first.
  useEffect(() => {
    if (!inviteToken) return;
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      setClearingSession(false);
      return;
    }
    if (signOutForInviteRef.current) return;
    signOutForInviteRef.current = true;
    setClearingSession(true);
    signOut({ redirect: false })
      .catch(() => setError('No se pudo cerrar la sesión anterior. Recarga la página.'))
      .finally(() => setClearingSession(false));
  }, [inviteToken, status]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteValidating(false);
      setInviteValid(false);
      return;
    }
    setInviteCookie(inviteToken);
    try {
      sessionStorage.setItem('org_invite_token', inviteToken);
    } catch {
      /* ignore */
    }
    setInviteValidating(true);
    fetch(`/api/invites/${encodeURIComponent(inviteToken)}/validate`)
      .then((r) => r.json())
      .then((data: { valid?: boolean; organizationName?: string; error?: string }) => {
        if (data.valid) {
          setInviteValid(true);
          setOrganizationName(data.organizationName ?? null);
        } else {
          setInviteValid(false);
          setError(data.error ?? 'Enlace de invitación no válido');
        }
      })
      .catch(() => setError('No se pudo validar el enlace'))
      .finally(() => setInviteValidating(false));
  }, [inviteToken]);

  const waitingForRegister =
    clearingSession ||
    (inviteToken && status === 'authenticated') ||
    (status === 'loading' && !sessionCheckTimedOut) ||
    inviteValidating;

  if (waitingForRegister) {
    return (
      <AppLoadingScreen
        message={
          clearingSession || (inviteToken && status === 'authenticated')
            ? 'Cerrando sesión anterior…'
            : undefined
        }
      />
    );
  }

  if (status === 'loading' && sessionCheckTimedOut) {
    return (
      <div
        style={{ minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
        className="bg-slate-950 flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-white">No se pudo verificar la sesión</h1>
          <p className="text-sm text-slate-400">Recarga la página e intenta de nuevo.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-block py-2.5 px-6 rounded-xl text-white text-sm font-semibold"
            style={{ background: '#FC0230' }}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  if (!inviteToken || !inviteValid) {
    return (
      <div
        style={{ minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
        className="bg-slate-950 flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Enlace de invitación requerido</h1>
          <p className="text-sm text-slate-400">
            {error ||
              'Para crear una cuenta necesitas el enlace que te envió tu empresa o aliado. Si ya tienes cuenta, inicia sesión.'}
          </p>
          <a
            href="/login"
            className="inline-block py-2.5 px-6 rounded-xl text-white text-sm font-semibold"
            style={{ background: '#FC0230' }}
          >
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!acceptTerms) {
      setError('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          inviteToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear la cuenta. Intenta nuevamente.');
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.assign('/home');
      } else {
        // Account created but auto-login failed — send to login
        router.push('/login?registered=1');
      }
    } catch {
      setError('No se pudo conectar al servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <div
        style={{ minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
        className="bg-slate-950 flex flex-col"
      >
        <PublicBrandNav>
          <a
            href="/login"
            className="text-[13px] font-medium text-slate-400 hover:text-primary-400 transition-colors"
          >
            ¿Ya tienes cuenta? <span className="text-primary-400">Inicia sesión</span>
          </a>
        </PublicBrandNav>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 bg-[#FC0230]/8 border border-[#FC0230]/20 rounded-full px-3 py-1 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FC0230]" />
                <span className="text-xs font-medium text-[#FC0230]">¡Únete gratis!</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Crear cuenta</h1>
              <p className="text-slate-400 text-sm mt-1">Completa tus datos para empezar a retar</p>
              {organizationName && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-slate-800 border border-slate-800 rounded-full px-3 py-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#FC0230]" />
                  Te unirás a: {organizationName}
                </p>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <GoogleSignInButton label="Registrarse con Google" callbackUrl="/" />
              <p className="text-[11px] text-center text-slate-500 leading-snug">
                Si te registras con Google, damos por aceptados los mismos términos que al registrarte con
                email.
              </p>
              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-xs text-slate-500 shrink-0">o con email y contraseña</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    autoComplete="name"
                    className="w-full border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-slate-800"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
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
                    className="w-full border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-slate-800"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    className="w-full border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-white placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B6AF] hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    autoComplete="new-password"
                    className="w-full border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-white placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B6AF] hover:text-slate-300 transition-colors"
                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* T&C checkbox */}
              <div className="flex items-start gap-3 pt-1">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => setAcceptTerms((v) => !v)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      acceptTerms
                        ? 'bg-[#FC0230] border-[#FC0230]'
                        : 'bg-slate-800 border-[#D1CFC8] hover:border-[#FC0230]/50'
                    }`}
                    aria-label="Aceptar términos y condiciones"
                  >
                    {acceptTerms && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
                <label htmlFor="terms" className="text-sm text-slate-400 leading-snug cursor-pointer select-none">
                  He leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-[#FC0230] font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    Términos y Condiciones
                  </button>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: '#FC0230' }}
              >
                {loading ? (
                  <>
                    <BoxChallengeLoader size="xs" compact showGlow={false} />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta →'
                )}
              </button>

              {/* Login link */}
              <p className="text-center text-sm text-slate-500 pt-1">
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="text-[#FC0230] font-medium hover:opacity-80 transition-opacity">
                  Inicia sesión
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<AppLoadingScreen />}
    >
      <RegisterPageContent />
    </Suspense>
  );
}
