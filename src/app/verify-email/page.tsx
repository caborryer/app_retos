'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicBrandNav from '@/components/brand/PublicBrandNav';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace inválido.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setStatus('success');
          setMessage('Tu correo ha sido confirmado. Ya puedes iniciar sesión.');
        } else {
          setStatus('error');
          setMessage(
            typeof data.error === 'string'
              ? data.error
              : 'No se pudo verificar el correo.'
          );
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Error de conexión. Intenta de nuevo.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <PublicBrandNav />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <BoxChallengeLoader />
              <p className="text-slate-400 text-sm">Verificando tu correo…</p>
            </div>
          )}
          {status === 'success' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-3">¡Listo!</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-block py-2.5 px-6 rounded-xl text-white text-sm font-semibold"
                style={{ background: '#FC0230' }}
              >
                Ir a iniciar sesión
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-3">No se pudo verificar</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link href="/login" className="text-primary-400 text-sm hover:underline">
                Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
