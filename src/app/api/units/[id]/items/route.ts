import { NextResponse } from 'next/server';
import { addUnitItem, getUnitByIdOrName } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unit = await getUnitByIdOrName(id);
    if (!unit) {
      return NextResponse.json({ error: 'Unit mobil tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();

    // Support Bulk Addition (e.g. from Excel paste)
    if (Array.isArray(body.items) && body.items.length > 0) {
      const person = body.person?.trim() || 'Petugas';
      const createdItems = [];
      for (const raw of body.items) {
        if (!raw.name || !raw.serialNumber) continue;
        const item = await addUnitItem(
          unit.id,
          {
            serialNumber: String(raw.serialNumber).trim(),
            name: String(raw.name).trim(),
            category: raw.category || 'Module',
            quantity: 1,
            status: 'available',
          },
          person
        );
        createdItems.push(item);
      }
      return NextResponse.json({ count: createdItems.length, items: createdItems }, { status: 201 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Nama barang wajib diisi' }, { status: 400 });
    }
    if (!body.serialNumber || !body.serialNumber.trim()) {
      return NextResponse.json({ error: 'Nomor part/seri wajib diisi' }, { status: 400 });
    }

    const person = body.person?.trim() || 'Petugas';
    const item = await addUnitItem(
      unit.id,
      {
        serialNumber: body.serialNumber,
        name: body.name,
        category: body.category || 'Module',
        compartment: body.compartment || '',
        quantity: typeof body.quantity === 'number' ? body.quantity : parseInt(body.quantity || '1', 10),
        unitType: body.unitType || 'Pcs',
        minStock: typeof body.minStock === 'number' ? body.minStock : parseInt(body.minStock || '1', 10),
        condition: body.condition || 'Good',
        status: body.status || 'available',
        notes: body.notes || null,
      },
      person
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add unit item:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan barang ke unit mobil' },
      { status: 500 }
    );
  }
}
