import { NextRequest, NextResponse } from 'next/server';
import { getItems, addItem, getItemBySerial, updateItem, addLog } from '@/lib/db';
import { sanitizeText, validateQuantity, validateSerialNumber } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ? sanitizeText(searchParams.get('category')) : undefined;
  const location = searchParams.get('location') ? sanitizeText(searchParams.get('location')) : undefined;
  const items = await getItems(category, location);
  return NextResponse.json(items, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { serialNumber, name, category, location, rack, status, person } = body;

    // Sanitasi input teks
    const cleanName = sanitizeText(name, 120);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Nama barang wajib diisi (minimal 2 karakter)' }, { status: 400 });
    }

    // Validasi kuantitas stok
    const qtyCheck = validateQuantity(body.quantity, 1, 50000);
    if (!qtyCheck.valid) {
      return NextResponse.json({ error: qtyCheck.error }, { status: 400 });
    }
    const quantity = qtyCheck.value;

    const cleanLocation = sanitizeText(location, 60) || 'Lab';
    const cleanRack = sanitizeText(rack, 80) || 'Lemari 1 - Tingkat 1';
    const cleanStatus = status === 'checked_out' ? 'checked_out' : 'available';
    const cleanCategory = sanitizeText(category, 60) || 'Umum';
    const logPerson = sanitizeText(person, 60) || 'Admin / Sistem';

    // Validasi atau generate serialNumber
    let cleanSerial = '';
    if (serialNumber && String(serialNumber).trim()) {
      const serialCheck = validateSerialNumber(serialNumber);
      if (!serialCheck.valid) {
        return NextResponse.json({ error: serialCheck.error }, { status: 400 });
      }
      cleanSerial = serialCheck.value;
    } else {
      // Auto generate serial unik berdasarkan nama barang
      const prefix = cleanName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 5) || 'BRG';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      cleanSerial = `${prefix}-${randomSuffix}`;
    }

    // Check if item with this serial already exists
    const existing = await getItemBySerial(cleanSerial);
    if (existing) {
      const newQty = Math.max(0, (existing.quantity || 0) + quantity);
      const updated = await updateItem(existing.serialNumber, {
        name: cleanName,
        category: cleanCategory,
        location: cleanLocation,
        rack: cleanRack,
        quantity: newQty,
        status: newQty > 0 ? 'available' : cleanStatus,
      });

      if (updated) {
        // Catat riwayat barang masuk (penambahan stok)
        await addLog({
          itemId: existing.id,
          serialNumber: existing.serialNumber,
          itemName: existing.name,
          action: 'in',
          person: logPerson,
          location: `${cleanRack} (${cleanLocation})`,
          quantity: quantity,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          ...updated,
          message: `Stok ${existing.name} (${existing.serialNumber}) ditambah ${quantity} pcs (total: ${updated.quantity} pcs) di ${cleanRack}`
        }, { status: 200 });
      }
      return NextResponse.json({ error: 'Gagal mengupdate stok' }, { status: 500 });
    }

    // Create new item
    const newItem = await addItem({
      serialNumber: cleanSerial,
      name: cleanName,
      category: cleanCategory,
      location: cleanLocation,
      rack: cleanRack,
      status: cleanStatus,
      quantity,
    });

    // Catat riwayat barang masuk (barang baru)
    await addLog({
      itemId: newItem.id,
      serialNumber: newItem.serialNumber,
      itemName: newItem.name,
      action: 'in',
      person: logPerson,
      location: `${cleanRack} (${cleanLocation})`,
      quantity: quantity,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses data barang' }, { status: 500 });
  }
}
