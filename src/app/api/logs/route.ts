import { NextRequest, NextResponse } from 'next/server';
import { getLogs, addLog, updateItemStatus, getItemBySerial } from '@/lib/db';

export async function GET() {
  const logs = await getLogs();
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serialNumber, action, person, location } = body;

  if (!serialNumber || !action || !person || !location) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const item = await getItemBySerial(serialNumber);
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // O-Ring bersifat habis pakai dan tidak dapat dikembalikan
  if (action === 'return' && item.category.toLowerCase() === 'o-ring') {
    return NextResponse.json(
      { error: 'Barang kategori O-Ring bersifat habis pakai dan tidak dapat dikembalikan.' },
      { status: 400 }
    );
  }

  // Update item status
  const newStatus = action === 'checkout' ? 'checked_out' : 'available';
  await updateItemStatus(serialNumber, newStatus);

  // Add log entry
  const log = await addLog({
    itemId: item.id,
    serialNumber: item.serialNumber,
    itemName: item.name,
    action,
    person,
    location,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json(log, { status: 201 });
}
