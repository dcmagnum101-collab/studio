import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect routes.
 * Redirects unauthenticated users to /login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const isPublicRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/unsubscribe') || 
    pathname.startsWith('/quick-capture') ||
    pathname.startsWith('/oh/') || // Public Open House sign-ins
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') || 
    pathname.includes('.') ||
    pathname === '/favicon.ico';

  // Check for session cookie (set by FirebaseProvider on sign-in)
  const session = request.cookies.get('monica-session');

  // If no session and route is protected, redirect to login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and tries to access login, redirect to dashboard
  if (session && pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Ensure middleware runs on all relevant paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};