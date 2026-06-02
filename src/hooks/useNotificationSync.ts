'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { clearUserSessionState } from '@/lib/sign-out-client';
import type { Notification } from '@/types';

const POLL_INTERVAL_MS = 30_000;

interface ServerNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

function toStoreNotification(n: ServerNotification): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type as Notification['type'],
    read: n.read,
    timestamp: new Date(n.createdAt),
    actionUrl: n.actionUrl ?? undefined,
  };
}

/**
 * Polls GET /api/notifications and replaces the store with the server list
 * for the current session user (no merge across accounts).
 */
export function useNotificationSync() {
  const { data: session, status } = useSession();
  const setNotifications = useAppStore((s) => s.setNotifications);
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id ?? null;

    if (status === 'unauthenticated' || !userId) {
      if (syncedUserIdRef.current !== null) {
        clearUserSessionState();
        syncedUserIdRef.current = null;
      }
      return;
    }

    if (syncedUserIdRef.current !== null && syncedUserIdRef.current !== userId) {
      clearUserSessionState();
    }
    syncedUserIdRef.current = userId;

    async function fetchAndReplace() {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (!res.ok) return;

        if (syncedUserIdRef.current !== userId) return;

        const data: { notifications: ServerNotification[]; unreadCount: number } =
          await res.json();

        setNotifications(
          data.notifications.map(toStoreNotification),
          data.unreadCount ?? 0
        );
      } catch {
        // Keep current UI on transient errors
      }
    }

    void fetchAndReplace();
    const interval = setInterval(fetchAndReplace, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, session?.user?.id, setNotifications]);
}
