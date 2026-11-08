import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  // Izinkan akses ke /login dan /api/auth
  if (path === '/login' || path.startsWith('/api/auth')) {
    if (role === 'admin' && path === '/login') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Publik / Pengunjung tanpa login:
  // - Boleh melihat (GET) dashboard, lokasi, kategori, log, dsb.
  // - Jika mencoba akses rute khusus admin (/admin atau /scan) -> arahkan ke /login
  // - Jika mencoba memodifikasi data via API tanpa login -> tolak 401
  if (!role) {
    if (path.startsWith('/admin') || path.startsWith('/scan')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (path.startsWith('/api/')) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return NextResponse.next();
      }
      return NextResponse.json({ error: 'Unauthorized: Silakan login sebagai Admin terlebih dahulu' }, { status: 401 });
    }

    // Izinkan akses publik untuk semua halaman lainnya (Dashboard, Location, Category, Logs)
    return NextResponse.next();
  }

  // Jika login sebagai viewer:
  // - Tidak boleh akses /admin dan /scan
  // - Tidak boleh memodifikasi data
  if (role === 'viewer') {
    if (path.startsWith('/admin') || path.startsWith('/scan')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith('/api/items') && request.method !== 'GET' && request.method !== 'HEAD') {
      return NextResponse.json({ error: 'Unauthorized: Hanya admin yang dapat mengubah master data barang' }, { status: 403 });
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
