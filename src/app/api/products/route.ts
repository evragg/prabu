// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// POST /api/products
// body: { name: string, sku: string, stock: number, note?: string }
export async function POST(request: Request) {
  const { name, sku, stock, note } = await request.json();

  if (!name || !sku || typeof stock !== 'number') {
    return NextResponse.json(
      { error: 'Nama, SKU, dan stok wajib diisi' },
      { status: 400 }
    );
  }

  // 1️⃣ Upsert product – if SKU exists, increase stock; otherwise create new product
  const product = await prisma.product.upsert({
    where: { sku },
    update: { stock: { increment: stock } },
    create: { name, sku, stock },
  });

  // 2️⃣ Record an "IN" transaction in the history table
  await prisma.inventoryTransaction.create({
    data: {
      productId: product.id,
      type: TransactionType.IN,
      quantity: stock,
      note: note ?? 'Penambahan barang via API',
    },
  });

  // 3️⃣ Return the up‑to‑date product record
  return NextResponse.json(product);
}
