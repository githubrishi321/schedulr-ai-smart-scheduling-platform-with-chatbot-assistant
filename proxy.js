/**
 * @fileoverview Next.js Proxy (replaces middleware.js in Next.js 16+)
 * Protects dashboard routes and API routes (except public ones).
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  // Public API routes — no auth needed
  const isPublicApi =
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/calendar/slots') ||
    pathname.startsWith('/api/cron') ||
    (pathname.startsWith('/api/bookings') && pathname.endsWith('/cancel') && req.method === 'POST') ||
    (pathname === '/api/bookings' && req.method === 'POST');

  // Protect dashboard pages
  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/event-types') ||
    pathname.startsWith('/availability') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/integrations');

  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith('/api/') && !isPublicApi && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/event-types/:path*',
    '/availability/:path*',
    '/bookings/:path*',
    '/settings/:path*',
    '/integrations/:path*',
    '/api/((?!auth|public|cron).*)',
  ],
};
