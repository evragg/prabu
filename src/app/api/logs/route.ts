import { NextRequest, NextResponse } from 'next/server';
import { getLogs, addLog, getItemBySerial, updateItemQuantity } from '@/lib/db';

export async function GET() {
  const logs = await getLogs();
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serialNumber, action, person, location } = body;
    const quantity = Math.max(1, parseInt(body.quantity) || 1);

    if (!serialNumber || !action || !person || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await getItemBySerial(serialNumber.trim());
    if (!item) {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }

    if (action === 'checkout') {
      // Check if enough stock is available
      if ((item.quantity || 0) < quantity) {
        return NextResponse.json(
          { error: `Stok tidak mencukupi. Tersedia: ${item.quantity || 0} pcs, diminta: ${quantity} pcs` },
          { status: 400 }
        );
      }

      // Subtract stock
      const updated = await updateItemQuantity(serialNumber.trim(), -quantity);

      // Create log entry
      const log = await addLog({
        itemId: item.id,
        serialNumber: item.serialNumber,
        itemName: item.name,
        action: 'checkout',
        person,
        location,
        quantity,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        ...log,
        remainingStock: updated?.quantity || 0,
        message: `Berhasil mengambil ${quantity} pcs ${item.name} (sisa: ${updated?.quantity || 0} pcs)`
      }, { status: 201 });

    } else if (action === 'return') {
      // O-Ring bersifat habis pakai dan tidak dapat dikembalikan
      if (item.category.toLowerCase() === 'o-ring') {
        return NextResponse.json(
          { error: 'Barang kategori O-Ring bersifat habis pakai dan tidak dapat dikembalikan.' },
          { status: 400 }
        );
      }

      // Add stock back
      const updated = await updateItemQuantity(serialNumber.trim(), quantity);

      // Create log entry
      const log = await addLog({
        itemId: item.id,
        serialNumber: item.serialNumber,
        itemName: item.name,
        action: 'return',
        person,
        location,
        quantity,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        ...log,
        remainingStock: updated?.quantity || 0,
        message: `Berhasil mengembalikan ${quantity} pcs ${item.name} (stok: ${updated?.quantity || 0} pcs)`
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan pemrosesan log' }, { status: 500 });
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
