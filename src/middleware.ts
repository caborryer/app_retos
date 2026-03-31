import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/admin/login'];
const ADMIN_ROUTES = ['/admin'];

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r);
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && pathname !== '/admin/login';
  const isApiAuth = pathname.startsWith('/api/auth');

  // Always allow auth API routes
  if (isApiAuth) return NextResponse.next();

  // Always allow public routes
  if (isPublic) return NextResponse.next();

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
