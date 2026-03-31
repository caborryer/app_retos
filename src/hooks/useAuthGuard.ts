'use client';

import { useSession } from 'next-auth/react';

/**
 * Returns `true` when the session is authenticated and ready.
 * The middleware (src/middleware.ts) handles the actual redirect;
 * this hook is kept for components that need a ready flag.
 */
export function useAuthGuard(): boolean {
  const { status } = useSession();
  return status === 'authenticated';
}
