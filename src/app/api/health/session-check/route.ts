import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/session-check
 * Returns whether auth() resolves cleanly (tests the exact same path as the root layout).
 * Useful to diagnose "Application error" after login on Vercel.
 */
export async function GET() {
  let session = null;
  let error: string | null = null;

  try {
    session = await auth();
  } catch (e) {
    error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error('[session-check] auth() threw:', error, e);
  }

  return NextResponse.json({
    ok: error === null,
    hasSession: session !== null,
    role: session?.user?.role ?? null,
    userId: session?.user?.id ? 'present' : null,
    error,
  });
}
