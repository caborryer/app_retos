import type { Notification } from '@/types';

export function createNotification(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'challenge' = 'info',
  actionUrl?: string
): Notification {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    type,
    read: false,
    timestamp: new Date(),
    actionUrl,
  };
}

// Notification templates
export const NotificationTemplates = {
  challengeStarted: (challengeTitle: string) =>
    createNotification(
      '¡Reto Iniciado!',
      `Has comenzado el reto "${challengeTitle}". ¡Mucha suerte!`,
      'challenge'
    ),

  challengeCompleted: (challengeTitle: string, points: number) =>
    createNotification(
      '🎉 ¡Reto Completado!',
      `¡Felicitaciones! Completaste "${challengeTitle}" y ganaste ${points} puntos.`,
      'success'
    ),

  taskCompleted: (taskTitle: string) =>
    createNotification(
      'Tarea Completada',
      `Has completado la tarea "${taskTitle}". ¡Sigue así!`,
      'success'
    ),

  photoValidated: (approved: boolean) =>
    createNotification(
      approved ? '✓ Foto Aprobada' : '✗ Foto Rechazada',
      approved
        ? 'Tu foto ha sido validada correctamente.'
        : 'Tu foto no cumple con los requisitos. Por favor, sube otra.',
      approved ? 'success' : 'warning'
    ),

  levelUp: (newLevel: number) =>
    createNotification(
      '🎊 ¡Subiste de Nivel!',
      `¡Felicitaciones! Ahora eres nivel ${newLevel}.`,
      'success'
    ),

  badgeEarned: (badgeName: string) =>
    createNotification(
      '🏅 Nueva Insignia',
      `Has desbloqueado la insignia "${badgeName}".`,
      'success'
    ),

  reminderChallenge: (challengeTitle: string, daysLeft: number) =>
    createNotification(
      '⏰ Recordatorio',
      `Te quedan ${daysLeft} días para completar "${challengeTitle}".`,
      'info'
    ),

  friendJoined: (friendName: string) =>
    createNotification(
      '👥 Nuevo Amigo',
      `${friendName} se unió a SportChallenge.`,
      'info'
    ),

  competitionInvite: (friendName: string, challengeTitle: string) =>
    createNotification(
      '🏆 Invitación a Competir',
      `${friendName} te invitó a competir en "${challengeTitle}".`,
      'challenge'
    ),

  dailyStreak: (days: number) =>
    createNotification(
      `🔥 Racha de ${days} Días`,
      `¡Increíble! Llevas ${days} días consecutivos activo.`,
      'success'
    ),
};
