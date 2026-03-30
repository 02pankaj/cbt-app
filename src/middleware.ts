import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const roleCookie = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE LOG] Path: ${pathname} | Role: ${roleCookie || 'None'}`);

  // --- PROTECT ADMIN AREA ---
  if (pathname.startsWith('/admin')) {
    if (roleCookie !== 'admin') {
      console.log("🚨 BLOCKED: Rerouting unauthorized user from Admin area.");
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  // --- PROTECT STUDENT AREA ---
  if (pathname.startsWith('/student')) {
    if (roleCookie !== 'student') {
      console.log("🚨 BLOCKED: Rerouting unauthorized user from Student area.");
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // --- AUTO-ROUTE LOGGED-IN USERS FROM HOME PAGE ---
  if (pathname === '/') {
    if (roleCookie === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (roleCookie === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/student/:path*'],
};