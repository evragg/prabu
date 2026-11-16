import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers, createUser } from '@/lib/db';

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 403 });
  }

  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pengguna' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, name, password, role } = body;

    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Username, nama lengkap, dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username minimal 3 karakter' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password minimal 4 karakter' },
        { status: 400 }
      );
    }

    const created = await createUser({
      username: username.trim(),
      name: name.trim(),
      password,
      role: role === 'admin' ? 'admin' : 'viewer',
    });

    if (!created) {
      return NextResponse.json(
        { error: 'Username sudah digunakan, silakan pilih username lain' },
        { status: 409 }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat pengguna baru' }, { status: 500 });
  }
}
