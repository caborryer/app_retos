'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

type Facing = 'user' | 'environment';

export interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with a JPEG file from the live capture */
  onCapture: (file: File) => void;
  maxBytes?: number;
  className?: string;
}

/**
 * Opens the device camera with a live preview; user captures a still to upload.
 * Requires HTTPS (or localhost). Falls back with clear errors if permission is denied.
 */
export default function CameraCaptureModal({
  open,
  onClose,
  onCapture,
  maxBytes = DEFAULT_MAX_BYTES,
  className,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<Facing>('user');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStream = useCallback(
    async (facing: Facing) => {
      setError(null);
      setStarting(true);
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError(
            'Tu navegador no permite acceder a la cámara desde aquí. Usa “Galería” o prueba con Chrome/Safari actualizado.'
          );
          setStarting(false);
          return;
        }
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch {
          // Menos restricciones: algunos navegadores fallan con facingMode estricto
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          el.playsInline = true;
          await el.play().catch(() => {});
        }
      } catch (e) {
        const name = e instanceof DOMException ? e.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Permiso de cámara denegado. Actívalo en la barra del navegador o en Ajustes.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setError('No se detectó ninguna cámara en este dispositivo.');
        } else {
          setError('No se pudo abrir la cámara. Prueba con la galería o otro navegador.');
        }
      } finally {
        setStarting(false);
      }
    },
    [stopStream]
  );

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      return;
    }
    attachStream(facingMode);
    return () => {
      stopStream();
    };
  }, [open, facingMode, attachStream, stopStream]);

  const flipCamera = () => {
    setFacingMode((f) => (f === 'user' ? 'environment' : 'user'));
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setCapturing(true);
    try {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        setError('La cámara aún no está lista. Espera un segundo e inténtalo de nuevo.');
        setCapturing(false);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCapturing(false);
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);

      const tryBlob = (quality: number, attempt: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setCapturing(false);
              return;
            }
            if (blob.size > maxBytes && attempt < 6) {
              tryBlob(quality - 0.08, attempt + 1);
              return;
            }
            if (blob.size > maxBytes) {
              setError('La foto sigue siendo demasiado grande. Prueba con más luz o usa la galería.');
              setCapturing(false);
              return;
            }
            const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopStream();
            onCapture(file);
            onClose();
            setCapturing(false);
          },
          'image/jpeg',
          quality
        );
      };
      tryBlob(0.92, 0);
    } catch {
      setCapturing(false);
      setError('No se pudo capturar la imagen.');
    }
  };

  const handleClose = () => {
    stopStream();
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-capture-title"
    >
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-200">
          <h2 id="camera-capture-title" className="text-base font-semibold text-secondary-900">
            Tomar foto
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-secondary-100 text-secondary-600"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3] sm:aspect-video">
          <video
            ref={videoRef}
            className={cn(
              'w-full h-full object-cover',
              facingMode === 'user' && '-scale-x-100'
            )}
            muted
            playsInline
            autoPlay
          />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
              Iniciando cámara…
            </div>
          )}
        </div>

        {error && (
          <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">{error}</p>
        )}

        <div className="p-4 flex flex-wrap gap-2 justify-center border-t border-secondary-100">
          <button
            type="button"
            onClick={flipCamera}
            disabled={starting || !!error}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-secondary-200 text-secondary-800 text-sm font-medium hover:bg-secondary-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Cambiar cámara
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={starting || capturing || !!error}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            {capturing ? 'Guardando…' : 'Capturar foto'}
          </button>
        </div>

        <p className="px-4 pb-4 text-center text-xs text-secondary-500">
          La vista previa se muestra en espejo en la cámara frontal. La foto guardada tendrá la orientación correcta.
        </p>
      </div>
    </div>
  );
}
