'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card from '../ui/Card';
import CameraCaptureModal from '@/components/ui/CameraCaptureModal';
import { preferNativeCameraPicker } from '@/lib/native-camera-input';
import { userFacingApiError } from '@/lib/user-facing-api-error';

interface PhotoUploadProps {
  taskId: string;
  challengeId: string;
  existingPhoto?: string;
  onPhotoUpload: (taskId: string, photoUrl: string) => void;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  className?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function PhotoUpload({
  taskId,
  challengeId: _challengeId,
  existingPhoto,
  onPhotoUpload,
  validationStatus = 'pending',
  className,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > MAX_BYTES) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        alert(await userFacingApiError(res, 'upload'));
        return;
      }
      const { url } = await res.json();
      setPreview(url);
      onPhotoUpload(taskId, url);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto. Intenta nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'approved':
        return 'border-green-500 bg-green-50';
      case 'rejected':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-secondary-200 bg-secondary-50';
    }
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraCaptureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden
      />

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => uploadFile(file)}
      />

      {!preview ? (
        <div className="flex flex-col gap-2">
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full aspect-square rounded-2xl border-2 border-dashed',
              'flex flex-col items-center justify-center gap-1',
              'hover:border-primary-500 hover:bg-primary-50',
              'transition-all duration-200',
              'bg-secondary-50 border-secondary-300'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                <span className="text-xs text-secondary-600">Subiendo...</span>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 text-secondary-400" />
                <span className="text-[10px] text-secondary-600 font-medium text-center px-1">
                  Galería
                </span>
              </>
            )}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => {
              if (preferNativeCameraPicker()) {
                cameraCaptureInputRef.current?.click();
              } else {
                setCameraOpen(true);
              }
            }}
            disabled={isUploading}
            className={cn(
              'w-full py-2 rounded-xl border-2 border-primary-500/40',
              'flex items-center justify-center gap-2 text-xs font-semibold text-primary-600',
              'bg-primary-50 hover:bg-primary-100 transition-colors',
              'disabled:opacity-50'
            )}
            whileTap={{ scale: 0.98 }}
          >
            <Camera className="w-4 h-4" />
            Tomar foto
          </motion.button>
        </div>
      ) : (
        <Card variant="elevated" className={cn('p-0 overflow-hidden', getStatusColor())}>
          <div className="relative aspect-square">
            <img
              src={preview}
              alt="Foto del reto"
              className="w-full h-full object-cover"
            />

            {validationStatus !== 'pending' && (
              <div className="absolute top-2 right-2">
                <div
                  className={cn(
                    'rounded-full p-2',
                    validationStatus === 'approved' ? 'bg-green-500' : 'bg-red-500'
                  )}
                >
                  {getStatusIcon()}
                </div>
              </div>
            )}

            {validationStatus === 'pending' && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {validationStatus === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/90 text-white text-xs font-medium py-2 px-3 text-center">
                Pendiente de validación
              </div>
            )}

            {validationStatus === 'approved' && (
              <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-xs font-medium py-2 px-3 text-center">
                ✓ Aprobada
              </div>
            )}

            {validationStatus === 'rejected' && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs font-medium py-2 px-3 text-center">
                ✗ Rechazada
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
