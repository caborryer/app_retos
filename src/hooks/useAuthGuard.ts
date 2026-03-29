'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

/** Reads the persisted Zustand state from localStorage without waiting for hydration. */
function getPersistedAuth(): boolean {
  if (typeof window === 'undefined') return true; // SSR: don't block
  try {
    const raw = localStorage.getItem('sport-challenge-storage');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { currentUser?: unknown; user?: unknown } };
    return !!(parsed?.state?.currentUser || parsed?.state?.user);
  } catch {
    return false;
  }
}

/**
 * Redirects to /login if no authenticated user is found.
 * Checks localStorage directly for an instant decision, then confirms via Zustand.
 * Returns `true` once it's safe to render protected content.
 */
export function useAuthGuard(): boolean {
  const router = useRouter();

  // Initialise from localStorage synchronously so the very first render
  // already knows whether to show content or keep the spinner.
  const [ready, setReady] = useState<boolean>(() => getPersistedAuth());

  useEffect(() => {
    const check = () => {
      const { currentUser, user } = useAppStore.getState();
      if (!currentUser && !user) {
        setReady(false);
        router.replace('/login');
      } else {
        setReady(true);
      }
    };

    if (useAppStore.persist.hasHydrated()) {
      check();
    } else {
      const unsub = useAppStore.persist.onFinishHydration(check);
      return unsub;
    }
  }, [router]);

  return ready;
}
