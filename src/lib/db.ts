import { prisma } from './prisma';

export interface Item {
  id: string;
  category: string;
  serialNumber: string;
  name: string;
  location: string;
  rack: string;
  status: string;
}

export interface LogEntry {
  id: string;
  itemId?: string | null;
  serialNumber: string;
  itemName: string;
  action: string;
  person: string;
  location: string;
  timestamp: string | Date;
}

export async function getItems(category?: string, location?: string): Promise<Item[]> {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return items.filter((item) => {
    let match = true;
    if (category) {
      const catA = item.category.toLowerCase().replace(/[\s-]+/g, '');
      const catB = category.toLowerCase().replace(/[\s-]+/g, '');
      match = match && catA === catB;
    }
    if (location) {
      const locA = item.location.toLowerCase().replace(/[\s-]+/g, '');
      const locB = location.toLowerCase().replace(/[\s-]+/g, '');
      match = match && locA === locB;
    }
    return match;
  });
}

export async function getItemBySerial(serial: string): Promise<Item | null> {
  const item = await prisma.item.findUnique({
    where: { serialNumber: serial },
  });
  if (item) return item;

  const all = await prisma.item.findMany();
  return all.find((i) => i.serialNumber.toLowerCase() === serial.toLowerCase()) || null;
}

export async function getItemsByLocation(location: string): Promise<Item[]> {
  const items = await prisma.item.findMany({
    orderBy: { rack: 'asc' },
  });
  const normalizedTarget = location.toLowerCase().replace(/[\s-]+/g, '');
  return items.filter(
    (item) => item.location.toLowerCase().replace(/[\s-]+/g, '') === normalizedTarget
  );
}

export async function getLocations(): Promise<string[]> {
  const items = await prisma.item.findMany({
    select: { location: true },
    distinct: ['location'],
  });
  const dbLocations = items.map((i) => i.location);
  const defaultLocations = ['Module Room'];
  return [...new Set([...defaultLocations, ...dbLocations])];
}

export async function getCategories(): Promise<string[]> {
  const items = await prisma.item.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  return items.map((i) => i.category);
}

export async function updateItemStatus(
  serialNumber: string,
  status: string
): Promise<Item | null> {
  try {
    // Case-insensitive lookup first
    const all = await prisma.item.findMany();
    const found = all.find(
      (i) => i.serialNumber.toLowerCase() === serialNumber.toLowerCase()
    );
    if (!found) return null;

    const updated = await prisma.item.update({
      where: { id: found.id },
      data: { status },
    });
    return updated;
  } catch {
    return null;
  }
}

export async function addLog(entry: Omit<LogEntry, 'id'>): Promise<LogEntry> {
  const log = await prisma.logEntry.create({
    data: {
      itemId: entry.itemId || null,
      serialNumber: entry.serialNumber,
      itemName: entry.itemName,
      action: entry.action,
      person: entry.person,
      location: entry.location,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    },
  });
  return log;
}

export async function getLogs(): Promise<LogEntry[]> {
  const logs = await prisma.logEntry.findMany({
    orderBy: { timestamp: 'desc' },
  });
  return logs;
}

export async function getStats() {
  const total = await prisma.item.count();
  const available = await prisma.item.count({
    where: { status: 'available' },
  });
  const checkedOut = await prisma.item.count({
    where: { status: 'checked_out' },
  });
  const locations = (
    await prisma.item.findMany({
      select: { location: true },
      distinct: ['location'],
    })
  ).length;
  const categories = (
    await prisma.item.findMany({
      select: { category: true },
      distinct: ['category'],
    })
  ).length;

  return {
    total,
    available,
    checkedOut,
    locations,
    categories,
  };
}

export async function addItem(itemData: Omit<Item, 'id'>): Promise<Item> {
  const newItem = await prisma.item.create({
    data: {
      serialNumber: itemData.serialNumber,
      name: itemData.name,
      category: itemData.category,
      location: itemData.location,
      rack: itemData.rack,
      status: itemData.status,
    },
  });
  return newItem;
}

export async function deleteItem(serialNumber: string): Promise<boolean> {
  try {
    // First find the item (case-insensitive) to get exact serialNumber
    const all = await prisma.item.findMany();
    const found = all.find(
      (i) => i.serialNumber.toLowerCase() === serialNumber.toLowerCase()
    );
    if (!found) return false;

    await prisma.item.delete({
      where: { id: found.id },
    });
    return true;
  } catch {
    return false;
  }
}
