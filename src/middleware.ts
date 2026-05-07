import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/admin/login', '/register'];
const ADMIN_ROUTES = ['/admin'];

function isRequestHttps(req: NextRequest) {
  return (
    req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'
  );
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  // Be resilient to cookie-name mismatches between environments (secure vs non-secure).
  // This avoids login loops where client session exists but middleware cannot read it.
  let token = await getToken({
    req,
    secret,
    secureCookie: isRequestHttps(req),
  });
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: !isRequestHttps(req),
    });
  }
  if (!token) {
    token = await getToken({
      req,
      secret,
    });
  }

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r);
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && pathname !== '/admin/login';
  const isApiAuth = pathname.startsWith('/api/auth');
  const isHealthEndpoint =
    pathname === '/api/health/auth' ||
    pathname === '/api/health/auth-check' ||
    pathname === '/api/health/session-check';

  // Always allow auth API routes
  if (isApiAuth) return NextResponse.next();
  if (isHealthEndpoint) return NextResponse.next();

  // Allow the public registration API endpoint
  if (pathname === '/api/register') return NextResponse.next();

  // Always allow public routes
  if (isPublic) return NextResponse.next();

  // Legacy challenge routes are no longer user-accessible.
  // Users should always play from /home (boards flow).
  if (pathname === '/challenges' || pathname.startsWith('/challenges/')) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Not logged in → redirect to /login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes require ADMIN role
  if (isAdminRoute && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
