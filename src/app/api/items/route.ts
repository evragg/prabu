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
    const { serialNumber, name, category, location, rack, status } = body;
    const quantity = Math.max(1, parseInt(body.quantity) || 1);

    if (!serialNumber || !name || !category || !location || !rack || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { addItem, getItemBySerial, updateItem } = await import('@/lib/db');

    // Check if serial already exists → if so, add to existing stock and update rack
    const existing = await getItemBySerial(serialNumber.trim());
    if (existing) {
      const newQty = Math.max(0, (existing.quantity || 0) + quantity);
      const updated = await updateItem(serialNumber.trim(), {
        name: name.trim(),
        category: category.trim(),
        location: location.trim(),
        rack: rack.trim(),
        quantity: newQty,
        status: newQty > 0 ? 'available' : status,
      });
      if (updated) {
        return NextResponse.json({
          ...updated,
          message: `Stok ${serialNumber} ditambah ${quantity} pcs (total: ${updated.quantity} pcs) di ${rack.trim()}`
        }, { status: 200 });
      }
      return NextResponse.json({ error: 'Gagal mengupdate stok' }, { status: 500 });
    }

    // Create new item with quantity as initial stock
    const newItem = await addItem({
      serialNumber: serialNumber.trim(),
      name: name.trim(),
      category: category.trim(),
      location: location.trim(),
      rack: rack.trim(),
      status,
      quantity,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
