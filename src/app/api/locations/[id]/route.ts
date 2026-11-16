import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { deleteLocation } from '@/lib/db';

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteLocation(id);
    return NextResponse.json({ message: 'Lokasi berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus lokasi' }, { status: 500 });
  }
}
