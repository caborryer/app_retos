import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Challenge, Notification, Activity, TabType } from '@/types';
import { ChallengeStatus } from '@/types';
import { USERS_DB, THEMED_BOARDS } from '@/lib/mockData';
import type { ThemedBoard } from '@/lib/mockData';

interface AppState {
  // Auth state
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  updateUserPoints: (points: number) => void;

  // Challenges state
  challenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: string, updates: Partial<Challenge>) => void;
  startChallenge: (id: string) => void;
  completeTask: (challengeId: string, taskId: string, photoUrl?: string, linkUrl?: string) => void;
  submitLinkAndComplete: (challengeId: string, linkUrl: string) => void;
  completeChallenge: (id: string) => void;
  uploadPhotoAndComplete: (challengeId: string, photoDataUrl: string) => void;
  resetChallenges: (newChallenges: Challenge[]) => void;
  validateTask: (challengeId: string, taskId: string, status: 'pending' | 'approved' | 'rejected', reason?: string) => void;

  // Boards state
  boards: ThemedBoard[];
  updateBoard: (id: string, updates: Partial<ThemedBoard>) => void;
  addBoard: (board: ThemedBoard) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
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
      (set, get) => ({
        // ── Initial state ────────────────────────────────────────────────────
        currentUser: null,
        user: null,
        challenges: [],
        activeChallenges: [],
        completedChallenges: [],
        boards: THEMED_BOARDS,
        notifications: [],
        unreadCount: 0,
        activities: [],
        activeTab: 'home',
        isLoading: false,
        selectedCategory: null,

        // ── Auth actions ──────────────────────────────────────────────────────
        login: (email, password) => {
          const found = USERS_DB.find(
            (u) => u.email === email && u.password === password
          );
          if (found) {
            // For regular users also populate `user` so the bingo board has access
            set({ currentUser: found, user: found.role === 'user' ? found : get().user });
            return true;
          }
          return false;
        },

        logout: () => set({ currentUser: null, user: null }),

        // ── User actions ─────────────────────────────────────────────────────
        setUser: (user) => set({ user }),

        updateUserPoints: (points) => {
          const { user } = get();
          if (user) {
            set({ user: { ...user, points: user.points + points } });
          }
        },

        // ── Challenge actions ─────────────────────────────────────────────────

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

        addChallenge: (challenge) => {
          set((state) => ({ challenges: [...state.challenges, challenge] }));
        },

        updateChallenge: (id, updates) => {
          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }));
        },

        startChallenge: (id) => {
          const { challenges, user } = get();
          const challenge = challenges.find((c) => c.id === id);
          if (!challenge || !user) return;
          // Idempotente: si ya está en progreso no hace nada
          if (challenge.status !== ChallengeStatus.NOT_STARTED) return;

          const updatedChallenge: Challenge = {
            ...challenge,
            status: ChallengeStatus.IN_PROGRESS,
            startDate: new Date(),
            endDate: new Date(
              Date.now() + challenge.duration * 24 * 60 * 60 * 1000
            ),
          };

          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === id ? updatedChallenge : c
            ),
            activeChallenges: [...state.activeChallenges, updatedChallenge],
            user: {
              ...user,
              activeChallenges: user.activeChallenges + 1,
            },
          }));

          get().addActivity({
            id: Date.now().toString(),
            userId: user.id,
            challengeId: id,
            type: 'start',
            timestamp: new Date(),
          });
        },

        // completeTask solo actualiza la tarea y el progreso.
        // NO completa el challenge aquí — eso le corresponde a completeChallenge
        // o a uploadPhotoAndComplete según el flujo.
        completeTask: (challengeId, taskId, photoUrl, linkUrl) => {
          const { challenges } = get();
          const challenge = challenges.find((c) => c.id === challengeId);
          if (!challenge) return;

          const updatedTasks = challenge.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completed: true,
                  completedAt: new Date(),
                  photoUrl: photoUrl ?? task.photoUrl,
                  linkUrl: linkUrl ?? task.linkUrl,
                  validationStatus: (photoUrl || linkUrl) ? 'pending' : task.validationStatus,
                }
              : task
          );

          const completedCount = updatedTasks.filter((t) => t.completed).length;
          const progress = Math.round((completedCount / updatedTasks.length) * 100);

          get().updateChallenge(challengeId, { tasks: updatedTasks, progress });
        },

        completeChallenge: (id) => {
          const { challenges, user } = get();
          const challenge = challenges.find((c) => c.id === id);
          if (!challenge || challenge.status === ChallengeStatus.COMPLETED) return;

          const wasInProgress = challenge.status === ChallengeStatus.IN_PROGRESS;

          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === id
                ? {
                    ...c,
                    status: ChallengeStatus.COMPLETED,
                    progress: 100,
                    startDate: c.startDate ?? new Date(),
                  }
                : c
            ),
            // Quitar de activeChallenges si estaba ahí
            activeChallenges: state.activeChallenges.filter((c) => c.id !== id),
            completedChallenges: [
              ...state.completedChallenges,
              { ...challenge, status: ChallengeStatus.COMPLETED, progress: 100 },
            ],
          }));

          if (user) {
            set({
              user: {
                ...user,
                points: user.points + challenge.points,
                completedChallenges: user.completedChallenges + 1,
                activeChallenges: wasInProgress
                  ? Math.max(0, user.activeChallenges - 1)
                  : user.activeChallenges,
              },
            });
          }
        },

        // Flujo único para completar una card con foto:
        // 1. Inicia el challenge si está NOT_STARTED
        // 2. Marca la primera photoTask pendiente con la foto
        // 3. Completa el challenge de forma atómica
        uploadPhotoAndComplete: (challengeId, photoDataUrl) => {
          const challenge = get().challenges.find((c) => c.id === challengeId);
          if (!challenge) return;
          if (challenge.status === ChallengeStatus.COMPLETED) return;

          // Paso 1: iniciar si hace falta
          if (challenge.status === ChallengeStatus.NOT_STARTED) {
            get().startChallenge(challengeId);
          }

          // Paso 2: marcar la primera tarea con foto pendiente
          // Releer del estado actualizado tras startChallenge
          const photoTask = get()
            .challenges.find((c) => c.id === challengeId)
            ?.tasks.find((t) => t.photoRequired && !t.completed);

          if (photoTask) {
            get().completeTask(challengeId, photoTask.id, photoDataUrl);
          }

          // Paso 3: completar el challenge
          get().completeChallenge(challengeId);
        },

        submitLinkAndComplete: (challengeId, linkUrl) => {
          const challenge = get().challenges.find((c) => c.id === challengeId);
          if (!challenge) return;
          if (challenge.status === ChallengeStatus.COMPLETED) return;

          if (challenge.status === ChallengeStatus.NOT_STARTED) {
            get().startChallenge(challengeId);
          }

          const linkTask = get()
            .challenges.find((c) => c.id === challengeId)
            ?.tasks.find((t) => !t.completed);

          if (linkTask) {
            get().completeTask(challengeId, linkTask.id, undefined, linkUrl);
          }

          get().completeChallenge(challengeId);
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

        validateTask: (challengeId, taskId, status, reason) => {
          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === challengeId
                ? {
                    ...c,
                    tasks: c.tasks.map((t) =>
                      t.id === taskId
                        ? {
                            ...t,
                            validationStatus: status,
                            rejectionReason: reason,
                            validatedAt: new Date(),
                            validatedBy: state.currentUser?.name ?? 'Admin',
                          }
                        : t
                    ),
                  }
                : c
            ),
          }));
        },

        // ── Boards actions ────────────────────────────────────────────────────
        updateBoard: (id, updates) => {
          set((state) => ({
            boards: state.boards.map((b) =>
              b.id === id ? { ...b, ...updates } : b
            ),
          }));
        },

        addBoard: (board) => {
          set((state) => ({ boards: [...state.boards, board] }));
        },

        // ── Notification actions ──────────────────────────────────────────────
        addNotification: (notification) => {
          set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
          }));
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

        clearNotifications: () => {
          set({ notifications: [], unreadCount: 0 });
        },

        // ── Activity actions ──────────────────────────────────────────────────
        addActivity: (activity) => {
          set((state) => ({
            activities: [activity, ...state.activities].slice(0, 50),
          }));
        },

        // ── UI actions ────────────────────────────────────────────────────────
        setActiveTab: (tab) => set({ activeTab: tab }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        setSelectedCategory: (category) => set({ selectedCategory: category }),
      }),
      {
        name: 'sport-challenge-storage',
        partialize: (state) => ({
          user: state.user,
          currentUser: state.currentUser,
          challenges: state.challenges,
          notifications: state.notifications,
          activeTab: state.activeTab,
          boards: state.boards,
        }),
      }
    )
  )
);