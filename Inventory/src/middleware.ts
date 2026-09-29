import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  // Izinkan akses ke /login dan /api/auth
  if (path === '/login' || path.startsWith('/api/auth')) {
    if (role && path === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Jika tidak ada role, redirect ke login (atau return 401 jika request API)
  if (!role) {
    if (path.startsWith('/api/')) {
      // Izinkan GET untuk API publik atau kembalikan 401
      if (request.method === 'GET') {
        return NextResponse.next();
      }
      return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Proteksi rute berdasarkan role
  // Viewer tidak boleh akses /admin dan /scan (tidak bisa CRUD)
  if (role === 'viewer') {
    if (path.startsWith('/admin') || path.startsWith('/scan')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Viewer juga tidak boleh hit API mutasi (POST/DELETE/PATCH)
    if (path.startsWith('/api/') && request.method !== 'GET' && request.method !== 'HEAD' && !path.startsWith('/api/auth')) {
      return NextResponse.json({ error: 'Unauthorized: Viewer read-only' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
