import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { updateUser, deleteUser, getUserById, getUsers } from '@/lib/db';

async function getAdminPayload(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (payload?.role !== 'admin') return null;
  return payload;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminPayload(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, role, password } = body;

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Jika ingin downgrade role admin ke viewer, pastikan masih ada admin lain
    if (role === 'viewer' && targetUser.role === 'admin') {
      const allUsers = await getUsers();
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat mengubah role: Sistem harus memiliki minimal 1 Admin aktif' },
          { status: 400 }
        );
      }
    }

    const updated = await updateUser(id, { name, role, password });
    if (!updated) {
      return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminPayload(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Cegah admin menghapus dirinya sendiri
    if (admin.username && targetUser.username.toLowerCase() === admin.username.toLowerCase()) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan' },
        { status: 400 }
      );
    }

    // Cegah menghapus jika hanya tersisa 1 admin
    if (targetUser.role === 'admin') {
      const allUsers = await getUsers();
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus admin terakhir pada sistem' },
          { status: 400 }
        );
      }
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus pengguna' }, { status: 500 });
  }
}
