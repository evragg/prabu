import { NextRequest, NextResponse } from 'next/server';
import { getLogs, addLog, getItemBySerial, updateItemQuantity } from '@/lib/db';
import { sanitizeText, validateQuantity } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const logs = await getLogs();
  return NextResponse.json(logs, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serialNumber, action, person, location } = body;

    const cleanSerial = sanitizeText(serialNumber, 50);
    const cleanAction = action === 'return' ? 'return' : action === 'checkout' ? 'checkout' : '';
    const cleanPerson = sanitizeText(person, 60);
    const cleanLocation = sanitizeText(location, 80);

    if (!cleanSerial || !cleanAction || !cleanPerson || !cleanLocation) {
      return NextResponse.json(
        { error: 'Serial number, aksi, nama orang, dan lokasi wajib diisi dengan benar' },
        { status: 400 }
      );
    }

    if (cleanPerson.length < 2) {
      return NextResponse.json(
        { error: 'Nama pengambil / pengembali minimal 2 karakter' },
        { status: 400 }
      );
    }

    // Validasi kuantitas
    const qtyCheck = validateQuantity(body.quantity, 1, 10000);
    if (!qtyCheck.valid) {
      return NextResponse.json({ error: qtyCheck.error }, { status: 400 });
    }
    const quantity = qtyCheck.value;

    const item = await getItemBySerial(cleanSerial);
    if (!item) {
      return NextResponse.json({ error: 'Barang tidak ditemukan di inventaris' }, { status: 404 });
    }

    if (cleanAction === 'checkout') {
      // Cek ketersediaan stok
      if ((item.quantity || 0) < quantity) {
        return NextResponse.json(
          { error: `Stok tidak mencukupi. Tersedia: ${item.quantity || 0} pcs, diminta: ${quantity} pcs` },
          { status: 400 }
        );
      }

      // Kurangi stok
      const updated = await updateItemQuantity(cleanSerial, -quantity);

      // Catat log
      const log = await addLog({
        itemId: item.id,
        serialNumber: item.serialNumber,
        itemName: item.name,
        action: 'checkout',
        person: cleanPerson,
        location: cleanLocation,
        quantity,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        ...log,
        remainingStock: updated?.quantity || 0,
        message: `Berhasil mengambil ${quantity} pcs ${item.name} (sisa: ${updated?.quantity || 0} pcs)`
      }, { status: 201 });

    } else if (cleanAction === 'return') {
      // O-Ring bersifat habis pakai dan tidak dapat dikembalikan
      if (item.category.toLowerCase() === 'o-ring') {
        return NextResponse.json(
          { error: 'Barang kategori O-Ring bersifat habis pakai dan tidak dapat dikembalikan.' },
          { status: 400 }
        );
      }

      // Tambahkan stok kembali
      const updated = await updateItemQuantity(cleanSerial, quantity);

      // Catat log
      const log = await addLog({
        itemId: item.id,
        serialNumber: item.serialNumber,
        itemName: item.name,
        action: 'return',
        person: cleanPerson,
        location: cleanLocation,
        quantity,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        ...log,
        remainingStock: updated?.quantity || 0,
        message: `Berhasil mengembalikan ${quantity} pcs ${item.name} (stok: ${updated?.quantity || 0} pcs)`
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Aksi transaksi tidak valid' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses log' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { clearLogs } = await import('@/lib/db');
    await clearLogs();
    return NextResponse.json({ message: 'Semua riwayat berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus riwayat' }, { status: 500 });
  }
}
