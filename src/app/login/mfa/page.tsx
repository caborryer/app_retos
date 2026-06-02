'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ShieldCheck } from 'lucide-react';
import PublicBrandNav from '@/components/brand/PublicBrandNav';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';

export default function LoginMfaPage() {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          useBackup ? { backupCode: code.trim() } : { totp: code.trim() }
        ),
      });
      const data = await res.json();

      if (!res.ok || !data.sessionToken) {
        setError(data.error ?? 'Código incorrecto');
        return;
      }

      const result = await signIn('credentials', {
        flow: 'session_token',
        loginToken: data.sessionToken,
        redirect: false,
      });

      if (result?.ok) {
        const role = data.role === 'ADMIN' ? '/admin' : '/home';
        window.location.assign(role);
        return;
      }

      setError('No se pudo completar el inicio de sesión.');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <PublicBrandNav />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FC0230]/10 mb-4">
              <ShieldCheck className="w-6 h-6 text-[#FC0230]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verificación en dos pasos</h1>
            <p className="text-slate-400 text-sm mt-1">
              {useBackup
                ? 'Introduce un código de respaldo'
                : 'Introduce el código de tu app de autenticación'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode={useBackup ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
              required
              className="w-full border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 bg-slate-800"
            />

            {error && (
              <p className="text-sm text-red-400 text-center" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#FC0230' }}
            >
              {loading ? <BoxChallengeLoader size="sm" /> : 'Verificar'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setUseBackup(!useBackup);
              setCode('');
              setError('');
            }}
            className="mt-4 w-full text-xs text-slate-500 hover:text-slate-300"
          >
            {useBackup ? 'Usar código de la app' : 'Usar código de respaldo'}
          </button>

          <p className="mt-6 text-center">
            <a href="/login" className="text-xs text-slate-500 hover:text-slate-300">
              Volver al login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
