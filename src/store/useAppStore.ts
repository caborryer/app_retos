import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Challenge, Notification, Activity, TabType } from '@/types';
import { ChallengeStatus } from '@/types';

// ─── State shape ─────────────────────────────────────────────────────────────
// Auth is now handled by NextAuth — this store only holds UI state and the
// client-side challenge cache (populated from the API).

interface AppState {
  // Client-side challenge cache (fetched from /api/challenges)
  challenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  updateChallenge: (id: string, updates: Partial<Challenge>) => void;
  resetChallenges: (newChallenges: Challenge[]) => void;

  // Notifications (synced from API per session — not persisted across users)
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Activity feed
  activities: Activity[];
  addActivity: (activity: Activity) => void;

  // UI state
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Filters
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // ── Initial state ──────────────────────────────────────────────────────
        challenges: [],
        activeChallenges: [],
        completedChallenges: [],
        notifications: [],
        unreadCount: 0,
        activities: [],
        activeTab: 'home',
        isLoading: false,
        selectedCategory: null,

        // ── Challenge cache actions ────────────────────────────────────────────
        setChallenges: (challenges) => {
          set({
            challenges,
            activeChallenges: challenges.filter(
              (c) => c.status === ChallengeStatus.IN_PROGRESS
            ),
            completedChallenges: challenges.filter(
              (c) => c.status === ChallengeStatus.COMPLETED
            ),
          });
        },

        updateChallenge: (id, updates) => {
          set((state) => {
            const updated = state.challenges.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            );
            return {
              challenges: updated,
              activeChallenges: updated.filter((c) => c.status === ChallengeStatus.IN_PROGRESS),
              completedChallenges: updated.filter((c) => c.status === ChallengeStatus.COMPLETED),
            };
          });
        },

        resetChallenges: (newChallenges) => {
          set({
            challenges: newChallenges,
            activeChallenges: newChallenges.filter(
              (c) => c.status === ChallengeStatus.IN_PROGRESS
            ),
            completedChallenges: newChallenges.filter(
              (c) => c.status === ChallengeStatus.COMPLETED
            ),
          });
        },

        // ── Notification actions ───────────────────────────────────────────────
        setNotifications: (notifications, unreadCount) => {
          set({
            notifications: notifications.slice(0, 50),
            unreadCount,
          });
        },

        addNotification: (notification) => {
          set((state) => {
            if (state.notifications.some((n) => n.id === notification.id)) {
              return state;
            }
            const next = [notification, ...state.notifications].slice(0, 50);
            return {
              notifications: next,
              unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
            };
          });
        },

        markAsRead: (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (!notification || notification.read) return state;
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          });
        },

        clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

        // ── Activity actions ───────────────────────────────────────────────────
        addActivity: (activity) => {
          set((state) => ({
            activities: [activity, ...state.activities].slice(0, 50),
          }));
        },

        // ── UI actions ─────────────────────────────────────────────────────────
        setActiveTab: (tab) => set({ activeTab: tab }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        setSelectedCategory: (category) => set({ selectedCategory: category }),
      }),
      {
        name: 'sport-challenge-ui',
        version: 1,
        migrate: (persisted) => {
          if (!persisted || typeof persisted !== 'object') return persisted as Record<string, unknown>;
          const { notifications: _n, unreadCount: _u, ...rest } = persisted as Record<string, unknown>;
          return rest;
        },
        partialize: (state) => ({
          activeTab: state.activeTab,
        }),
      }
    )
  )
);
