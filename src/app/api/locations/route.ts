import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCustomLocations, createLocation } from '@/lib/db';
import { sanitizeText } from '@/lib/validation';

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const locations = await getCustomLocations();
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil daftar lokasi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const cleanName = sanitizeText(body.name, 60);

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Nama lokasi minimal 2 karakter' }, { status: 400 });
    }

    const created = await createLocation(cleanName);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Nama lokasi sudah ada' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menambahkan lokasi' }, { status: 500 });
  }
}
