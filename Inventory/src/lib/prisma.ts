import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;

// Pesan error yang jelas (muncul di log Vercel) kalau DATABASE_URL salah/kosong.
if (!url || !/^postgres(ql)?:\/\//.test(url)) {
  throw new Error(
    'DATABASE_URL belum diatur atau bukan URL PostgreSQL (harus diawali postgresql://). ' +
      'Set di Vercel: Project Settings > Environment Variables.'
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
