import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'data', 'inventory.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    console.log('Seeding items...');
    for (const item of data.items || []) {
      await prisma.item.upsert({
        where: { serialNumber: item.serialNumber },
        update: {
          category: item.category,
          name: item.name,
          location: item.location,
          rack: item.rack,
          status: item.status,
        },
        create: {
          id: item.id,
          category: item.category,
          serialNumber: item.serialNumber,
          name: item.name,
          location: item.location,
          rack: item.rack,
          status: item.status,
        },
      });
    }

    console.log('Seeding logs...');
    for (const log of data.logs || []) {
      await prisma.logEntry.create({
        data: {
          serialNumber: log.serialNumber,
          itemName: log.itemName,
          action: log.action,
          person: log.person,
          location: log.location,
          timestamp: new Date(log.timestamp),
        },
      });
    }

    console.log('Database seeding complete!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
