import { NextResponse } from 'next/server';
import { updateUnitItem, deleteUnitItem, adjustUnitItemQuantity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    // Check if it's a quantity adjustment (Ambil / Kembalikan)
    if (typeof body.delta === 'number') {
      const person = body.person?.trim() || 'Petugas';
      const actionType = body.actionType || (body.delta < 0 ? 'checkout' : 'return');
      const note = body.note?.trim();

      const updated = await adjustUnitItemQuantity(itemId, body.delta, person, actionType, note);
      if (!updated) {
        return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    // Normal item edit
    const updated = await updateUnitItem(itemId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update unit item:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengubah data barang' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const url = new URL(request.url);
    const person = url.searchParams.get('person') || 'Petugas';

    const success = await deleteUnitItem(itemId, person);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Failed to delete unit item:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus barang' },
      { status: 500 }
    );
  }
}
