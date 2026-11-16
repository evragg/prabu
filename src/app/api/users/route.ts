import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers, createUser } from '@/lib/db';
import { sanitizeText, validateUsername } from '@/lib/validation';

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

    const userCheck = validateUsername(username);
    if (!userCheck.valid) {
      return NextResponse.json({ error: userCheck.error }, { status: 400 });
    }

    const cleanName = sanitizeText(name, 80);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi (minimal 2 karakter)' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json({ error: 'Password minimal 4 karakter' }, { status: 400 });
    }

    if (password.length > 100) {
      return NextResponse.json({ error: 'Password maksimal 100 karakter' }, { status: 400 });
    }

    const created = await createUser({
      username: userCheck.value,
      name: cleanName,
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
