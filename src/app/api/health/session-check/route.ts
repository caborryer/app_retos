import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/session-check
 * Enhanced diagnostics: checks cookies received, secret presence, and auth() result.
 */
export async function GET(req: NextRequest) {
  let session = null;
  let error: string | null = null;

  // Inspect cookies from next/headers (what auth() sees)
  const cookieStore = await cookies();
  const allCookieNames = cookieStore.getAll().map((c) => c.name);
  const hasSecureToken = allCookieNames.includes('__Secure-authjs.session-token');
  const hasInsecureToken = allCookieNames.includes('authjs.session-token');
  const hasCallbackUrl = allCookieNames.includes('__Secure-authjs.callback-url') || allCookieNames.includes('authjs.callback-url');

  // Also check the raw Cookie header (what the browser actually sent)
  const rawCookieHeader = req.headers.get('cookie') ?? '';
  const cookieNamesFromHeader = rawCookieHeader
    .split(';')
    .map((p) => p.split('=')[0].trim())
    .filter(Boolean);

  // Check env vars (only whether they're set, not their values)
  const hasAuthSecret = !!process.env.AUTH_SECRET;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const effectiveSecret = hasAuthSecret ? 'AUTH_SECRET' : hasNextAuthSecret ? 'NEXTAUTH_SECRET' : 'NONE';

  try {
    session = await auth();
  } catch (e) {
    error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error('[session-check] auth() threw:', error, e);
  }

  const result = {
    ok: error === null,
    hasSession: session !== null,
    role: session?.user?.role ?? null,
    userId: session?.user?.id ? 'present' : null,
    error,
    cookies: {
      hasSecureToken,
      hasInsecureToken,
      hasCallbackUrl,
      allNames: allCookieNames,
      rawHeaderNames: cookieNamesFromHeader,
    },
    env: {
      effectiveSecret,
      hasAuthSecret,
      hasNextAuthSecret,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  console.log('[session-check]', JSON.stringify(result));
  return NextResponse.json(result);
}
