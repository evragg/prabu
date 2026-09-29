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

    if (!serialNumber || !name || !category || !location || !rack || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { addItem, getItemBySerial } = await import('@/lib/db');
    
    // Check if serial already exists
    const existing = await getItemBySerial(serialNumber);
    if (existing) {
      return NextResponse.json({ error: 'Serial number already exists' }, { status: 409 });
    }

    const newItem = await addItem({
      serialNumber,
      name,
      category,
      location,
      rack,
      status
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
