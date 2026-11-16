import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { signToken } from '@/lib/auth';

const SALT = process.env.PASSWORD_SALT || 'slb-tlm-inv-salt-x9k2';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + SALT).digest('hex');
}

// Password disimpan sebagai hash, bukan plaintext
const USERS: Record<string, { passwordHash: string; role: string }> = {
  admin: { passwordHash: hashPassword('admin'), role: 'admin' },
  evra: { passwordHash: hashPassword('evra'), role: 'admin' },
  prabu: { passwordHash: hashPassword('prabu'), role: 'viewer' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, guest } = body;

    // Handle continue without login (guest / viewer)
    if (guest) {
      const token = await signToken({ role: 'viewer' });
      const response = NextResponse.json({ success: true, role: 'viewer' });

      // JWT httpOnly cookie (digunakan middleware untuk auth & security)
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

    const user = USERS[username as keyof typeof USERS];
    const inputHash = hashPassword(password || '');

    if (user && user.passwordHash === inputHash) {
      const token = await signToken({ role: user.role, username });
      const response = NextResponse.json({ success: true, role: user.role });

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
