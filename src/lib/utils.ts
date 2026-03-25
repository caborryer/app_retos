import { type ClassValue, clsx } from 'clsx';
import { format, formatDistance, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Utilidad para combinar clases de Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Formatea una fecha de manera relativa
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date, formatStr: string = 'PPP'): string {
  return format(date, formatStr, { locale: es });
}

/**
 * Calcula el nivel basado en los puntos
 */
export function calculateLevel(points: number): number {
  // Cada nivel requiere 200 puntos más que el anterior
  // Nivel 1: 0-200, Nivel 2: 200-400, etc.
  return Math.floor(points / 200) + 1;
}

/**
 * Calcula el progreso hacia el siguiente nivel
 */
export function getLevelProgress(points: number): number {
  const pointsInCurrentLevel = points % 200;
  return (pointsInCurrentLevel / 200) * 100;
}

/**
 * Obtiene el nombre de la categoría en español
 */
export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    running: 'Running',
    cycling: 'Ciclismo',
    gym: 'Gimnasio',
    swimming: 'Natación',
    yoga: 'Yoga',
    team_sports: 'Deportes de Equipo',
    outdoor: 'Aire Libre',
    mixed: 'Mixto',
  };
  return names[category] || category;
}

/**
 * Obtiene el nombre de la dificultad en español
 */
export function getDifficultyName(difficulty: string): string {
  const names: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
  };
  return names[difficulty] || difficulty;
}

/**
 * Obtiene el color de la dificultad
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#3B82F6',
    advanced: '#F59E0B',
    expert: '#EF4444',
  };
  return colors[difficulty] || '#6B7280';
}

/**
 * Formatea la duración en días
 */
export function formatDuration(days: number): string {
  if (days === 1) return '1 día';
  if (days < 7) return `${days} días`;
  if (days === 7) return '1 semana';
  if (days < 30) return `${Math.floor(days / 7)} semanas`;
  if (days < 60) return '1 mes';
  return `${Math.floor(days / 30)} meses`;
}

/**
 * Trunca un texto a un número máximo de caracteres
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatea un número grande con abreviaciones
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Debounce function para optimizar búsquedas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Valida si una imagen es válida (simple check)
 */
export function isValidImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase());
}

