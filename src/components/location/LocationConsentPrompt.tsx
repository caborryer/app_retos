'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X } from 'lucide-react';

const STORAGE_KEY = 'sportbingo_location_consent_v1';

type StoredConsent = {
  status: 'accepted' | 'declined';
  decidedAt: string;
};

function readStored(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredConsent;
    if (p?.status !== 'accepted' && p?.status !== 'declined') return null;
    return p;
  } catch {
    return null;
  }
}

function writeStored(data: StoredConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Modal to obtain explicit consent before requesting browser geolocation.
 * Persists choice in localStorage; sends coords to POST /api/user/location when accepted.
 */
export default function LocationConsentPrompt() {
  const { status, data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistConsentWithoutCoords = useCallback(async () => {
    const res = await fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ consent: true }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(typeof j.error === 'string' ? j.error : 'No se pudo guardar el consentimiento.');
    }
    writeStored({ status: 'accepted', decidedAt: new Date().toISOString() });
    setVisible(false);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    const stored = readStored();
    if (stored) return;
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [status, session?.user]);

  const handleDecline = useCallback(() => {
    writeStored({ status: 'declined', decidedAt: new Date().toISOString() });
    setVisible(false);
    setError(null);
  }, []);

  const handleAccept = useCallback(() => {
    if (!navigator.geolocation) {
      setLoading(true);
      setError(null);
      persistConsentWithoutCoords()
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Error al guardar.');
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              consent: true,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(typeof j.error === 'string' ? j.error : 'No se pudo guardar la ubicación.');
          }
          writeStored({ status: 'accepted', decidedAt: new Date().toISOString() });
          setVisible(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Error al guardar.');
        } finally {
          setLoading(false);
        }
      },
      (err: GeolocationPositionError) => {
        setLoading(false);
        // 1 = denied, 2 = unavailable, 3 = timeout
        if (err.code === 1) {
          setError(
            'Permiso de ubicación denegado. Para activarlo: 1) haz clic en el candado junto a la URL, 2) en "Ubicación" selecciona "Permitir", 3) recarga la página. También puedes ir a Configuración del navegador > Privacidad y seguridad > Configuración del sitio > Ubicación.'
          );
          return;
        }
        if (err.code === 2) {
          setLoading(true);
          setError(null);
          persistConsentWithoutCoords()
            .catch(() => {
              setError('No se pudo determinar la posición. Comprueba el GPS o la red.');
            })
            .finally(() => setLoading(false));
          return;
        }
        setLoading(true);
        setError(null);
        persistConsentWithoutCoords()
          .catch(() => {
            setError('No se pudo obtener tu ubicación. Inténtalo más tarde.');
          })
          .finally(() => setLoading(false));
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 20_000,
      }
    );
  }, [persistConsentWithoutCoords]);

  if (status !== 'authenticated') return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="loc-consent-title"
          aria-describedby="loc-consent-desc"
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="p-5 border-b border-secondary-100 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="loc-consent-title" className="text-lg font-bold text-secondary-900 pr-8">
                  Ubicación aproximada
                </h2>
                <p id="loc-consent-desc" className="text-sm text-secondary-600 mt-2 leading-relaxed">
                  Si aceptas, guardamos tu ubicación <strong className="text-secondary-800">una vez</strong>{' '}
                  de forma aproximada mientras usas el juego, para entender mejor desde qué zonas se conecta la
                  comunidad. Más adelante el equipo podrá ver estadísticas agregadas en el panel de
                  administración. No compartimos tu ubicación con otros jugadores.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDecline}
                className="p-1.5 rounded-full hover:bg-secondary-100 text-secondary-500 -mt-1 -mr-1"
                aria-label="Cerrar y rechazar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <p className="mx-5 mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="p-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleDecline}
                disabled={loading}
                className="order-2 sm:order-1 px-4 py-2.5 rounded-xl border border-secondary-200 text-secondary-800 text-sm font-medium hover:bg-secondary-50 disabled:opacity-50"
              >
                No, gracias
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className="order-1 sm:order-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Obteniendo ubicación…
                  </>
                ) : (
                  'Aceptar y continuar'
                )}
              </button>
            </div>

            <p className="px-5 pb-4 text-[11px] text-secondary-500 leading-snug">
              Tras pulsar aceptar, tu navegador te pedirá permiso de ubicación. Puedes revocarlo cuando quieras
              en los ajustes del sitio.
            </p>
            {error?.toLowerCase().includes('denegado') && (
              <div className="px-5 pb-4">
                <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3 text-[11px] text-secondary-700 leading-snug">
                  Si ya lo bloqueaste antes, el navegador no vuelve a preguntar automáticamente.
                  Actualiza el permiso del sitio y recarga para intentar de nuevo.
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
