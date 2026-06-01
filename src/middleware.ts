import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getConfiguredAppOrigin, getProductionVercelHost } from '@/lib/app-url';

/**
 * Redirect production traffic from the default *.vercel.app URL to the custom domain.
 * Preview deployments (branch URLs) are not affected.
 */
export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.next();
  }

  const canonicalOrigin = getConfiguredAppOrigin();
  const productionVercelHost = getProductionVercelHost();
  if (!canonicalOrigin || !productionVercelHost) {
    return NextResponse.next();
  }

  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (!host || host !== productionVercelHost) {
    return NextResponse.next();
  }

  const canonical = new URL(canonicalOrigin);
  const destination = request.nextUrl.clone();
  destination.protocol = canonical.protocol;
  destination.host = canonical.host;

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
