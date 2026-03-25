'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, Check, Camera } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import ChallengeGrid from '@/components/challenges/ChallengeGrid';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration, formatNumber, getDifficultyName, getDifficultyColor, formatRelativeTime } from '@/lib/utils';
import { notFound } from 'next/navigation';
import type { Challenge } from '@/types';

export default function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const { challenges, setChallenges, startChallenge, completeTask, user, setUser } = useAppStore();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    // Initialize data if empty (direct URL access)
    if (challenges.length === 0) {
      const { mockChallenges, mockUser } = require('@/lib/mockData');
      setChallenges(mockChallenges);
      if (!user) {
        setUser(mockUser);
      }
    }
  }, [challenges.length, user, setChallenges, setUser]);

  useEffect(() => {
    if (challenges.length > 0) {
      const found = challenges.find(c => c.id === params.id);
      setChallenge(found || null);
      setIsLoading(false);
    }
  }, [params.id, challenges]);

  if (isLoading) {
    return (
      <Layout showBack title="">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-secondary-600">Cargando reto...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!challenge) {
    return (
      <Layout showBack title="">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Reto no encontrado
          </h2>
          <p className="text-secondary-600 mb-6">
            El reto que buscas no existe o ha sido eliminado.
          </p>
          <Button onClick={() => window.history.back()}>
            Volver atrás
          </Button>
        </div>
      </Layout>
    );
  }

  const isInProgress = challenge.status === 'in_progress';
  const isCompleted = challenge.status === 'completed';
  const canStart = challenge.status === 'not_started';

  const handleStartChallenge = () => {
    startChallenge(challenge.id);
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(challenge.id, taskId);
  };

  const handlePhotoButtonClick = (taskId: string) => {
    // Abrir el selector de archivos
    const input = fileInputRefs.current[taskId];
    if (input) {
      input.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida (JPG, PNG, GIF)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    try {
      // Crear preview y convertir a base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        // Completar la tarea con la foto
        completeTask(challenge.id, taskId, photoUrl);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      alert('Error al procesar la imagen. Intenta nuevamente.');
    }

    // Limpiar el input para permitir seleccionar la misma imagen de nuevo
    event.target.value = '';
  };

  const handlePhotoUpload = (taskId: string, photoUrl: string) => {
    completeTask(challenge.id, taskId, photoUrl);
  };

  return (
    <Layout showBack title="">
      <div className="space-y-6 -mt-4">
        {/* Hero Card */}
        <Card variant="gradient" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              >
                {getDifficultyName(challenge.difficulty)}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                {challenge.title}
              </h1>
            </div>

            <div className="text-5xl">{challenge.icon}</div>
          </div>

          <p className="text-white/90 mb-4">
            {challenge.description}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <Calendar className="w-5 h-5 text-white/80 mx-auto mb-1" />
              <div className="text-sm font-medium text-white">
                {formatDuration(challenge.duration)}
              </div>
              <div className="text-xs text-white/70">Duración</div>
            </div>
            
            <div className="text-center">
              <Users className="w-5 h-5 text-white/80 mx-auto mb-1" />
              <div className="text-sm font-medium text-white">
                {formatNumber(challenge.participants)}
              </div>
              <div className="text-xs text-white/70">Participantes</div>
            </div>
            
            <div className="text-center">
              <Trophy className="w-5 h-5 text-white/80 mx-auto mb-1" />
              <div className="text-sm font-medium text-white">
                +{challenge.points}
              </div>
              <div className="text-xs text-white/70">Puntos</div>
            </div>
          </div>
        </Card>

        {/* Progress (if in progress) */}
        {isInProgress && (
          <Card variant="elevated" className="p-6">
            <h2 className="text-lg font-bold text-secondary-900 mb-4">
              Tu Progreso
            </h2>
            <ProgressBar
              value={challenge.progress}
              variant="gradient"
              showLabel
              size="lg"
            />
            
            {challenge.startDate && (
              <p className="text-sm text-secondary-600 mt-3 text-center">
                Iniciado {formatRelativeTime(challenge.startDate)}
              </p>
            )}
          </Card>
        )}

        {/* Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-secondary-900">
            Tareas del Reto
          </h2>

          <div className="space-y-3">
            {challenge.tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  variant="elevated"
                  className="p-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        task.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-secondary-100 text-secondary-400'
                      }`}
                    >
                      {task.completed ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold ${
                          task.completed ? 'text-secondary-500 line-through' : 'text-secondary-900'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-secondary-600 mt-1">
                          {task.description}
                        </p>
                      )}
                      
                      {task.photoRequired && !task.completed && (
                        <div className="flex items-center gap-1 text-xs text-primary-500 mt-2">
                          <Camera className="w-3 h-3" />
                          <span>Foto requerida</span>
                        </div>
                      )}

                      {task.completedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Completado {formatRelativeTime(task.completedAt)}
                        </p>
                      )}
                    </div>

                    {isInProgress && !task.completed && (
                      <>
                        {task.photoRequired ? (
                          <>
                            <input
                              ref={(el) => (fileInputRefs.current[task.id] = el)}
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => handleFileSelect(e, task.id)}
                              className="hidden"
                            />
                            <Button
                              size="sm"
                              onClick={() => handlePhotoButtonClick(task.id)}
                              leftIcon={<Camera className="w-4 h-4" />}
                            >
                              Subir Foto
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            Completar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Photo Grid (if in progress) */}
        {isInProgress && (
          <ChallengeGrid 
            title="Galería del Reto" 
            count={9}
            challengeId={challenge.id}
            tasks={challenge.tasks.map(t => ({
              id: t.id,
              photoUrl: t.photoUrl,
              validationStatus: t.validationStatus as 'pending' | 'approved' | 'rejected' | undefined
            }))}
            onPhotoUpload={handlePhotoUpload}
          />
        )}

        {/* Action Button */}
        <div className="pb-6">
          {canStart && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleStartChallenge}
            >
              Comenzar Reto
            </Button>
          )}

          {isCompleted && (
            <Card variant="elevated" className="p-6 text-center">
              <div className="text-6xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                ¡Reto Completado!
              </h3>
              <p className="text-secondary-600 mb-4">
                Has ganado {challenge.points} puntos
              </p>
              <Badge variant="success" size="lg">
                <Trophy className="w-4 h-4 mr-1" />
                +{challenge.points} puntos
              </Badge>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

