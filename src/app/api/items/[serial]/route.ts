import { NextRequest, NextResponse } from 'next/server';
import { getItemBySerial, updateItem, deleteItem } from '@/lib/db';
import { sanitizeText, validateQuantity } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  if (!serial) {
    return NextResponse.json({ error: 'Serial number wajib diisi' }, { status: 400 });
  }

  const cleanSerial = sanitizeText(serial, 50);
  const item = await getItemBySerial(cleanSerial);
  if (!item) {
    return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  const cleanSerial = sanitizeText(serial, 50);

  try {
    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      const cleanName = sanitizeText(body.name, 120);
      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json({ error: 'Nama barang minimal 2 karakter' }, { status: 400 });
      }
      updateData.name = cleanName;
    }

    if (body.category !== undefined) {
      updateData.category = sanitizeText(body.category, 60);
    }

    if (body.location !== undefined) {
      updateData.location = sanitizeText(body.location, 60);
    }

    if (body.rack !== undefined) {
      updateData.rack = sanitizeText(body.rack, 80);
    }

    if (body.status !== undefined) {
      updateData.status = body.status === 'checked_out' ? 'checked_out' : 'available';
    }

    if (body.quantity !== undefined) {
      const qtyCheck = validateQuantity(body.quantity, 0, 50000);
      if (!qtyCheck.valid) {
        return NextResponse.json({ error: qtyCheck.error }, { status: 400 });
      }
      updateData.quantity = qtyCheck.value;
      if (updateData.quantity <= 0) {
        updateData.status = 'checked_out';
      }
    }

    const item = await updateItem(cleanSerial, updateData);
    if (!item) {
      return NextResponse.json({ error: 'Barang tidak ditemukan atau gagal diperbarui' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui barang' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  return PATCH(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  if (!serial) {
    return NextResponse.json({ error: 'Serial number wajib diisi' }, { status: 400 });
  }

  const cleanSerial = sanitizeText(serial, 50);
  const success = await deleteItem(cleanSerial);
  if (!success) {
    return NextResponse.json({ error: 'Barang tidak ditemukan atau gagal dihapus' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Barang berhasil dihapus' });
}
