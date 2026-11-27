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
        category: body.category,
        compartment: body.compartment,
        quantity: typeof body.quantity === 'number' ? body.quantity : parseInt(body.quantity || '1', 10),
        unitType: body.unitType,
        minStock: typeof body.minStock === 'number' ? body.minStock : parseInt(body.minStock || '1', 10),
        condition: body.condition,
        status: body.status,
        notes: body.notes,
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
