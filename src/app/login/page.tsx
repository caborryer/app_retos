'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // If already logged in, redirect on mount (using getState to avoid hydration race)
    const check = () => {
      const { currentUser } = useAppStore.getState();
      if (currentUser?.role === 'admin') router.replace('/admin');
      else if (currentUser?.role === 'user') router.replace('/home');
    };
    if (useAppStore.persist.hasHydrated()) {
      check();
    } else {
      useAppStore.persist.onFinishHydration(check);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400));

    const ok = login(email.trim(), password);

    if (ok) {
      // Read directly from store — no stale closure
      const { currentUser } = useAppStore.getState();
      router.push(currentUser?.role === 'admin' ? '/admin' : '/home');
    } else {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    }
    setLoading(false);
  }

  return (
    <div
      style={{ minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
      className="bg-[#FAFAF9] flex flex-col"
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-[60px] border-b border-[#EEECEA] bg-[#FAFAF9] sticky top-0 z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#1C1C1A] font-bold text-[15px] tracking-tight"
        >
          <div className="w-7 h-7 rounded-lg bg-[#FC0230] flex items-center justify-center">
            <span className="text-sm">🏆</span>
          </div>
          SportBingo
        </button>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1C1C1A] tracking-tight">Iniciar sesión</h1>
            <p className="text-[#6B6B67] text-sm mt-1">Accede a tu tablero de retos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#444441] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full border border-[#E5E3DC] rounded-xl pl-10 pr-4 py-3 text-[#1C1C1A] placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#444441] mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B6AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-[#E5E3DC] rounded-xl pl-10 pr-11 py-3 text-[#1C1C1A] placeholder-[#B8B6AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#FC0230]/40 focus:border-[#FC0230] transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B6AF] hover:text-[#444441] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
          </form>

          <p className="text-center text-xs text-[#9B9B95] mt-4">
            ¿Quieres ver primero cómo funciona?{' '}
            <button onClick={() => router.push('/')} className="text-[#FC0230] hover:underline font-medium">
              Ver demo
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
