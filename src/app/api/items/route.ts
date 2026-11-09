import { NextRequest, NextResponse } from 'next/server';
import { getItems } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const location = searchParams.get('location') || undefined;
  const items = await getItems(category, location);
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { serialNumber, name, category, location, rack, status } = body;
    const quantity = Math.max(1, parseInt(body.quantity) || 1);

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama barang wajib diisi' }, { status: 400 });
    }

    const trimmedName = name.trim();
    location = location?.trim() || 'Lab';
    rack = rack?.trim() || 'Lemari 1 - Tingkat 1';
    status = status || 'available';
    category = category?.trim() || 'Umum';

    const { addItem, getItemBySerial, updateItem, getItems } = await import('@/lib/db');

    // If serialNumber is provided, use it; otherwise generate a clean unique serial code
    if (serialNumber && serialNumber.trim()) {
      serialNumber = serialNumber.trim();
    } else {
      // Auto generate serial based on name + unique identifier
      const prefix = trimmedName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 5) || 'BRG';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      serialNumber = `${prefix}-${randomSuffix}`;
    }

    // Check if item with this serial or exact same name in same rack already exists
    const existing = await getItemBySerial(serialNumber);
    if (existing) {
      const newQty = Math.max(0, (existing.quantity || 0) + quantity);
      const updated = await updateItem(existing.serialNumber, {
        name: trimmedName,
        category,
        location,
        rack,
        quantity: newQty,
        status: newQty > 0 ? 'available' : status,
      });
      if (updated) {
        return NextResponse.json({
          ...updated,
          message: `Stok ${existing.name} ditambah ${quantity} pcs (total: ${updated.quantity} pcs) di ${rack}`
        }, { status: 200 });
      }
      return NextResponse.json({ error: 'Gagal mengupdate stok' }, { status: 500 });
    }

    // Create new item
    const newItem = await addItem({
      serialNumber,
      name: trimmedName,
      category,
      location,
      rack,
      status,
      quantity,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
