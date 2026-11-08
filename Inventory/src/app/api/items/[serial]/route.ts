import { NextRequest, NextResponse } from 'next/server';
import { getItemBySerial, updateItem, deleteItem } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  const item = await getItemBySerial(serial);
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  const body = await request.json();
  const item = await updateItem(serial, body);
  if (!item) {
    return NextResponse.json({ error: 'Item not found or failed to update' }, { status: 404 });
  }
  return NextResponse.json(item);
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
    return NextResponse.json({ error: 'Serial is required' }, { status: 400 });
  }
  
  const success = await deleteItem(serial.toLowerCase());
  if (!success) {
    return NextResponse.json({ error: 'Item not found or failed to delete' }, { status: 404 });
  }
  
  return NextResponse.json({ message: 'Item deleted successfully' });
}
