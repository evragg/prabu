import { NextRequest, NextResponse } from 'next/server';
import { signToken, hashPassword } from '@/lib/auth';
import { getUserByUsername } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, guest } = body;

    // Handle continue without login (guest / viewer)
    if (guest) {
      const token = await signToken({ role: 'viewer' });
      const response = NextResponse.json({ success: true, role: 'viewer' });

      // JWT httpOnly cookie (digunakan middleware untuk validasi keamanan)
      response.cookies.set('auth_token', token, {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Display-only cookie untuk UI (Navbar, dsb.) — BUKAN untuk validasi auth
      response.cookies.set('user_role', 'viewer', {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: false,
        sameSite: 'lax',
      });

      return response;
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // Ambil data user dari database / fallback store
    const user = await getUserByUsername(username.trim());
    const inputHash = hashPassword(password);

    if (user && user.password === inputHash) {
      const token = await signToken({ role: user.role, username: user.username });
      const response = NextResponse.json({
        success: true,
        role: user.role,
        username: user.username,
        name: user.name,
      });

      // JWT httpOnly cookie
      response.cookies.set('auth_token', token, {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Display-only cookie untuk UI
      response.cookies.set('user_role', user.role, {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: false,
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE() {
  // Logout — hapus kedua cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  response.cookies.delete('user_role');
  return response;
}
