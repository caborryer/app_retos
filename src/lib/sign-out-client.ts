import { signOut as nextAuthSignOut, type SignOutParams } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';

/** Clears client state that must not leak across user sessions. */
export function clearUserSessionState() {
  useAppStore.getState().clearNotifications();
}

/**
 * Signs out and clears persisted UI state (notifications) for the previous user.
 */
export async function signOutWithCleanup(options?: SignOutParams<false>) {
  clearUserSessionState();
  await nextAuthSignOut(options);
}
