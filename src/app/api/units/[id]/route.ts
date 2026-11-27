import { NextResponse } from 'next/server';
import { getUnitByIdOrName, updateUnit, deleteUnit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unit = await getUnitByIdOrName(id);
    if (!unit) {
      return NextResponse.json({ error: 'Unit mobil tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(unit);
  } catch (error) {
    console.error('Failed to get unit:', error);
    return NextResponse.json({ error: 'Failed to get unit' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateUnit(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Unit mobil tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update unit:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengubah unit mobil' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteUnit(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete unit:', error);
    return NextResponse.json({ error: 'Gagal menghapus unit' }, { status: 500 });
  }
}
