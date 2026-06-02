'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { readApiJsonOrThrow } from '@/lib/read-api-json';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';

export default function MfaSettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupQr, setSetupQr] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/mfa/status', { credentials: 'include' });
      const body = await readApiJsonOrThrow<{ mfaEnabled: boolean }>(
        res,
        'No se pudo cargar MFA'
      );
      if (!res.ok) throw new Error('No se pudo cargar MFA');
      setMfaEnabled(body.mfaEnabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function startSetup() {
    setError(null);
    setFeedback(null);
    setBusy(true);
    try {
      const res = await fetch('/api/user/mfa/setup', { method: 'POST', credentials: 'include' });
      const body = await readApiJsonOrThrow<{ qrDataUrl: string; secret: string; error?: string }>(
        res,
        'No se pudo iniciar MFA'
      );
      if (!res.ok) throw new Error(body.error ?? 'No se pudo iniciar MFA');
      setSetupQr(body.qrDataUrl);
      setSetupSecret(body.secret);
      setBackupCodes(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function enableMfa() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/user/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: confirmCode }),
      });
      const body = await readApiJsonOrThrow<{ backupCodes?: string[]; error?: string }>(
        res,
        'No se pudo activar MFA'
      );
      if (!res.ok) throw new Error(body.error ?? 'Código incorrecto');
      setBackupCodes(body.backupCodes ?? []);
      setMfaEnabled(true);
      setSetupQr(null);
      setSetupSecret(null);
      setConfirmCode('');
      setFeedback('MFA activado correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function disableMfa() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/user/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      const body = await readApiJsonOrThrow<{ error?: string }>(res, 'No se pudo desactivar MFA');
      if (!res.ok) throw new Error(body.error ?? 'No se pudo desactivar');
      setMfaEnabled(false);
      setDisablePassword('');
      setDisableCode('');
      setFeedback('MFA desactivado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <BoxChallengeLoader size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary-500" />
        <h2 className="text-lg font-semibold text-white">Autenticación en dos pasos</h2>
      </div>
      <p className="text-sm text-slate-400">
        {mfaEnabled
          ? 'Tu cuenta tiene MFA activo. Al iniciar sesión con email y contraseña se pedirá un código.'
          : 'Añade una capa extra de seguridad con una app de autenticación (Google Authenticator, 1Password, etc.).'}
      </p>

      {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {backupCodes && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-200">Guarda estos códigos de respaldo</p>
          <p className="text-xs text-amber-200/80">Solo se muestran una vez. Úsalos si pierdes acceso a tu app.</p>
          <ul className="font-mono text-sm text-white grid grid-cols-2 gap-1">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {!mfaEnabled && !setupQr && (
        <Button type="button" onClick={startSetup} disabled={busy}>
          {busy ? 'Preparando…' : 'Activar MFA'}
        </Button>
      )}

      {!mfaEnabled && setupQr && (
        <div className="space-y-4">
          <img src={setupQr} alt="Código QR MFA" className="mx-auto rounded-lg bg-white p-2" />
          {setupSecret && (
            <p className="text-xs text-slate-500 text-center break-all">
              Clave manual: <span className="text-slate-300 font-mono">{setupSecret}</span>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            placeholder="Código de 6 dígitos"
            className="w-full border border-slate-700 rounded-xl px-4 py-3 text-white text-center bg-slate-800"
          />
          <Button type="button" onClick={enableMfa} disabled={busy || confirmCode.length < 6}>
            Confirmar y activar
          </Button>
        </div>
      )}

      {mfaEnabled && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">Para desactivar MFA, confirma tu contraseña y un código TOTP.</p>
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Contraseña actual"
            className="w-full border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm bg-slate-800"
          />
          <input
            type="text"
            inputMode="numeric"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="Código TOTP"
            className="w-full border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm bg-slate-800"
          />
          <Button type="button" variant="secondary" onClick={disableMfa} disabled={busy}>
            Desactivar MFA
          </Button>
        </div>
      )}
    </div>
  );
}
