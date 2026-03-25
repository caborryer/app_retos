// Tipos principales de la aplicación

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  points: number;
  badges: Badge[];
  completedChallenges: number;
  activeChallenges: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  duration: number;
  startDate?: Date;
  endDate?: Date;
  status: ChallengeStatus;
  progress: number;
  tasks: ChallengeTask[];
  images: string[];
  participants: number;
  icon: string;
  color: string;
}

export interface ChallengeTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  photoRequired: boolean;
  photoUrl?: string;
  completedAt?: Date;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  validatedBy?: string;
  validatedAt?: Date;
}

export enum ChallengeCategory {
  RUNNING     = 'running',
  CYCLING     = 'cycling',
  GYM         = 'gym',
  SWIMMING    = 'swimming',
  YOGA        = 'yoga',
  TEAM_SPORTS = 'team_sports',
  OUTDOOR     = 'outdoor',
  MIXED       = 'mixed',
  PETS        = 'pets',        // ← nueva categoría
}

export enum ChallengeDifficulty {
  BEGINNER     = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED     = 'advanced',
  EXPERT       = 'expert',
}

export enum ChallengeStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  EXPIRED     = 'expired',
  ABANDONED   = 'abandoned',
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  completed: boolean;
  reward: number;
}

export interface Activity {
  id: string;
  userId: string;
  challengeId: string;
  type: 'start' | 'progress' | 'complete' | 'abandon';
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'challenge';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
}

export type TabType = 'home' | 'challenges' | 'activity' | 'profile';

export interface FilterOptions {
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  status?: ChallengeStatus;
  sortBy?: 'popular' | 'recent' | 'difficulty' | 'points';
}