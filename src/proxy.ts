import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('ntr_session');
  const { pathname } = request.nextUrl;

  // 1. Allow Essential Paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/logo.webp' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Simple Check: Just check if cookie exists (Ignore HMAC for debugging)
  if (!sessionCookie) {
    console.log(`[MIDDLEWARE] No session cookie for ${pathname}`);
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized: No Cookie' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Simple Role Check (Assume first part of cookie is payload)
  try {
    const payloadBase64 = sessionCookie.value.split('.')[0];
    const session = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

    // ป้องกันหน้า Admin
    if (pathname.startsWith('/admin') && !session.role.includes('admin')) {
      return NextResponse.redirect(new URL('/user', request.url));
    }

    // ป้องกันหน้า User (Agent)
    if (pathname.startsWith('/user') && !session.role.includes('agent')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect จากหน้าแรกไป Dashboard ที่เหมาะสม
    if (pathname === '/') {
      if (session.role.includes('admin')) return NextResponse.redirect(new URL('/admin', request.url));
      return NextResponse.redirect(new URL('/user', request.url));
    }
  } catch (e) {
    console.log(`[MIDDLEWARE] Error parsing session cookie:`, e);
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized: Parsing Error' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|logo.webp).*)'],
};
