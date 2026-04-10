'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react';

// ─── T&C Modal ────────────────────────────────────────────────────────────────

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEECEA]">
          <h2 className="font-bold text-[#1C1C1A] text-base">Términos y Condiciones</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F4F3EE] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-[#6B6B67]" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-4 text-sm text-[#444441] leading-relaxed">
          <section>
            <h3 className="font-semibold text-[#1C1C1A] mb-1">1. Aceptación de los términos</h3>
            <p>Al registrarte en SportBingo, aceptas cumplir y quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.</p>
          </section>
          <section>
            <h3 className="font-semibold text-[#1C1C1A] mb-1">2. Uso de la plataforma</h3>
            <p>SportBingo es una plataforma de retos deportivos y de bienestar. Te comprometes a utilizar la plataforma de forma lícita y respetuosa, sin subir contenido falso, ofensivo o que infrinja derechos de terceros.</p>
          </section>
          <section>
            <h3 className="font-semibold text-[#1C1C1A] mb-1">3. Evidencias y validación</h3>
            <p>Las evidencias (fotos, enlaces de Strava u otros) que subas deben ser auténticas y corresponder a la actividad real realizada. El equipo organizador se reserva el derecho de rechazar evidencias que no cumplan los requisitos del reto.</p>
          </section>
          <section>
            <h3 className="font-semibold text-[#1C1C1A] mb-1">4. Privacidad de datos</h3>
            <p>Tus datos personales (nombre, email) se utilizan exclusivamente para gestionar tu cuenta y participación en los retos. No compartimos tu información con terceros sin tu consentimiento expreso, salvo obligación legal.</p>
          </section>
          <section>
            <h3 className="font-semibold text-[#1C1C1A] mb-1">5. Modificaciones</h3>
            <p>SportBingo se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma y entrarán en vigor a los 7 días de su publicación.</p>
          </section>
          <section>
            <h3 className="font-semibold text-[#1C1C1A] mb-1">6. Contacto</h3>
            <p>Para cualquier consulta sobre estos términos, puedes contactarnos a través del panel de la aplicación.</p>
          </section>
        </div>
        <div className="px-6 py-4 border-t border-[#EEECEA]">
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

// ─── Register Page ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();

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

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.assign('/home');
    }
  }, [status]);

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
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
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
        className="bg-[#FAFAF9] flex flex-col"
      >
        {/* Nav */}
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
          <a
            href="/login"
            className="text-[13px] font-medium text-[#6B6B67] hover:text-[#FC0230] transition-colors"
          >
            ¿Ya tienes cuenta? <span className="text-[#FC0230]">Inicia sesión</span>
          </a>
        </nav>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 bg-[#FC0230]/8 border border-[#FC0230]/20 rounded-full px-3 py-1 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FC0230]" />
                <span className="text-xs font-medium text-[#FC0230]">¡Únete gratis!</span>
              </div>
              <h1 className="text-2xl font-bold text-[#1C1C1A] tracking-tight">Crear cuenta</h1>
              <p className="text-[#6B6B67] text-sm mt-1">Completa tus datos para empezar a retar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#444441] mb-1.5">
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
                    className="w-full border border-[#E5E3DC] rounded-xl pl-10 pr-4 py-3 text-[#1C1C1A] placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-white"
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
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
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#444441] mb-1.5">
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
                    className="w-full border border-[#E5E3DC] rounded-xl pl-10 pr-11 py-3 text-[#1C1C1A] placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B6AF] hover:text-[#444441] transition-colors"
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
                        : 'bg-white border-[#D1CFC8] hover:border-[#FC0230]/50'
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
                <label htmlFor="terms" className="text-sm text-[#6B6B67] leading-snug cursor-pointer select-none">
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
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta →'
                )}
              </button>

              {/* Login link */}
              <p className="text-center text-sm text-[#9B9B95] pt-1">
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
