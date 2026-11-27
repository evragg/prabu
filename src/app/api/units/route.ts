import { NextResponse } from 'next/server';
import { getUnits, createUnit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const units = await getUnits();
    return NextResponse.json(units);
  } catch (error) {
    console.error('Failed to fetch units:', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Nama unit wajib diisi' }, { status: 400 });
    }

    const unit = await createUnit({
      name: body.name,
      plateNumber: body.plateNumber,
      vehicleType: body.vehicleType,
      driver: body.driver,
      status: body.status || 'active',
      notes: body.notes,
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create unit:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat unit mobil baru' },
      { status: 500 }
    );
  }
}
