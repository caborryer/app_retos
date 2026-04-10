'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
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
 * Polls GET /api/notifications every 30 seconds and syncs results into
 * the Zustand notification store. Deduplicates by ID so existing local
 * notifications are not duplicated.
 */
export function useNotificationSync() {
  const { status } = useSession();
  const { notifications, addNotification } = useAppStore();
  const knownIds = useRef<Set<string>>(new Set());

  // Seed knownIds from the current store on first mount
  useEffect(() => {
    notifications.forEach((n) => knownIds.current.add(n.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function fetchAndMerge() {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data: { notifications: ServerNotification[]; unreadCount: number } = await res.json();

        // Add only notifications not already in the store (newest first from server)
        for (const sn of data.notifications) {
          if (!knownIds.current.has(sn.id)) {
            knownIds.current.add(sn.id);
            addNotification(toStoreNotification(sn));
          }
        }
      } catch {
        // Silent fail — keep current UI
      }
    }

    fetchAndMerge();
    const interval = setInterval(fetchAndMerge, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, addNotification]);
}
