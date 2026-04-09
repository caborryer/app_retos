'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

export default function NextAuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  /** Passed from the root layout (server) so the client matches the cookie on first paint. */
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session ?? undefined} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
