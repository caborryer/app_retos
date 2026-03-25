'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface PhotoUploadProps {
  taskId: string;
  challengeId: string;
  existingPhoto?: string;
  onPhotoUpload: (taskId: string, photoUrl: string) => void;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  className?: string;
}

export default function PhotoUpload({
  taskId,
  challengeId,
  existingPhoto,
  onPhotoUpload,
  validationStatus = 'pending',
  className,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        
        // Simulate upload delay
        setTimeout(() => {
          onPhotoUpload(taskId, result);
          setIsUploading(false);
        }, 1000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
      alert('Error al subir la foto. Intenta nuevamente.');
    }
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
        return <X className="w-5 h-5 text-red-600" />;
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

      {!preview ? (
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'w-full aspect-square rounded-2xl border-2 border-dashed',
            'flex flex-col items-center justify-center gap-2',
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
              <Camera className="w-8 h-8 text-secondary-400" />
              <span className="text-xs text-secondary-600 font-medium">
                Subir Foto
              </span>
            </>
          )}
        </motion.button>
      ) : (
        <Card variant="elevated" className={cn('p-0 overflow-hidden', getStatusColor())}>
          <div className="relative aspect-square">
            <img
              src={preview}
              alt="Foto del reto"
              className="w-full h-full object-cover"
            />
            
            {/* Status Badge */}
            {validationStatus !== 'pending' && (
              <div className="absolute top-2 right-2">
                <div className={cn(
                  'rounded-full p-2',
                  validationStatus === 'approved' ? 'bg-green-500' : 'bg-red-500'
                )}>
                  {getStatusIcon()}
                </div>
              </div>
            )}

            {/* Remove Button */}
            {validationStatus === 'pending' && (
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Pending Badge */}
            {validationStatus === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/90 text-white text-xs font-medium py-2 px-3 text-center">
                Pendiente de validación
              </div>
            )}

            {/* Approved Badge */}
            {validationStatus === 'approved' && (
              <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-xs font-medium py-2 px-3 text-center">
                ✓ Aprobada
              </div>
            )}

            {/* Rejected Badge */}
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
