import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'slb-tlm-inventory-default-secret-2026'
);

/**
 * Verifikasi JWT token dari cookie httpOnly auth_token.
 * Mengembalikan role jika valid, null jika tidak.
 */
async function getVerifiedRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as { role?: string }).role || null;
  } catch {
    // Token invalid, expired, atau dimanipulasi
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Verifikasi role dari JWT aman (bukan dari cookie client yang bisa diubah via DevTools)
  const role = await getVerifiedRole(request);
  const path = request.nextUrl.pathname;

  // Izinkan akses ke /login, /api/auth, dan file statis
  if (path === '/login' || path.startsWith('/api/auth')) {
    if (role === 'admin' && path === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Izinkan akses ke file statis (gambar, favicon, dsb.)
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/)) {
    return NextResponse.next();
  }

  // Jika JWT tidak valid atau belum login:
  if (!role) {
    // Izinkan API GET untuk server-side data fetching awal jika diperlukan
    if (path.startsWith('/api/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return NextResponse.next();
    }

    // Tolak request mutasi API tanpa otentikasi
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    // Redirect semua page ke /login
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Bersihkan cookie user_role yang mungkin palsu atau stale
    response.cookies.delete('user_role');
    return response;
  }

  // Jika login sebagai viewer (mode hanya lihat / tanpa login):
  if (role === 'viewer') {
    if (path.startsWith('/admin') || path.startsWith('/scan')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith('/api/items') && request.method !== 'GET' && request.method !== 'HEAD') {
      return NextResponse.json(
        { error: 'Unauthorized: Hanya admin yang dapat mengubah master data barang' },
        { status: 403 }
      );
    }

    if (path.startsWith('/api/logs') && request.method === 'POST') {
      return NextResponse.json(
        { error: 'Unauthorized: Hubungi Admin untuk mengambil atau mengembalikan barang' },
        { status: 403 }
      );
    }
  }

  // Admin memiliki akses penuh ke seluruh rute & API
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
