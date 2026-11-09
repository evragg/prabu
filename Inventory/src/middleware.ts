import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  // Izinkan akses ke /login, /api/auth, dan static assets
  if (path === '/login' || path.startsWith('/api/auth')) {
    if (role === 'admin' && path === '/login') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Izinkan akses ke file statis (gambar, dll)
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/)) {
    return NextResponse.next();
  }

  // Jika belum login (tidak ada cookie role), redirect ke /login
  if (!role) {
    // Izinkan API GET requests untuk SSR data fetching
    if (path.startsWith('/api/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return NextResponse.next();
    }

    // Tolak API non-GET tanpa login
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Silakan login sebagai Admin terlebih dahulu' }, { status: 401 });
    }

    // Redirect semua halaman ke /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika login sebagai viewer:
  // - Tidak boleh akses /admin dan /scan
  // - Tidak boleh memodifikasi data
  if (role === 'viewer') {
    if (path.startsWith('/admin') || path.startsWith('/scan')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith('/api/items') && request.method !== 'GET' && request.method !== 'HEAD') {
      return NextResponse.json({ error: 'Unauthorized: Hanya admin yang dapat menambah atau mengubah master data barang' }, { status: 403 });
    }

    if (path.startsWith('/api/logs') && request.method === 'POST') {
      return NextResponse.json({ error: 'Unauthorized: Hubungi Admin untuk mengambil atau mengembalikan barang' }, { status: 403 });
    }
  }

  // Admin memiliki akses penuh ke seluruh halaman & API
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
