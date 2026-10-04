import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

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

// Fallback Memory/JSON Store
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'inventory.json');

function getFallbackData(): { items: Item[]; logs: LogEntry[] } {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    items: [
      { id: '1', category: 'O-Ring', serialNumber: 'BO11870', name: 'O-Ring 50mm NBR', location: 'Module Room', rack: 'Rak - A1', status: 'available' },
      { id: '2', category: 'O-Ring', serialNumber: 'BO11871', name: 'O-Ring 70mm Viton', location: 'Module Room', rack: 'Rak - B2', status: 'available' },
      { id: '3', category: 'O-Ring', serialNumber: 'BO11872', name: 'O-Ring 30mm Silicone', location: 'Module Room', rack: 'Rak - C1', status: 'checked_out' },
      { id: '4', category: 'O-Ring', serialNumber: 'BO11873', name: 'O-Ring 100mm EPDM', location: 'Module Room', rack: 'Rak - D2', status: 'available' },
      { id: '5', category: 'O-Ring', serialNumber: 'BO11874', name: 'O-Ring 45mm NBR', location: 'Module Room', rack: 'Rak - B4', status: 'available' },
      { id: '6', category: 'O-Ring', serialNumber: 'BO11875', name: 'O-Ring 60mm Viton', location: 'Module Room', rack: 'Rak - C3', status: 'checked_out' },
      { id: '7', category: 'O-Ring', serialNumber: 'BO11876', name: 'O-Ring 25mm PTFE', location: 'Module Room', rack: 'Rak - E4', status: 'available' },
      { id: '8', category: 'O-Ring', serialNumber: 'BO11877', name: 'O-Ring 80mm NBR', location: 'Module Room', rack: 'Rak - B2', status: 'available' },
      { id: '9', category: 'MRTM-2245', serialNumber: '2245', name: 'MRTM', location: 'Module Room', rack: 'Rak - D4', status: 'checked_out' },
      { id: '10', category: 'O-Ring', serialNumber: 'BO11880', name: 'O-Ring 40mm FKM', location: 'Module Room', rack: 'Rak - A2', status: 'available' }
    ],
    logs: []
  };
}

function saveFallbackData(data: { items: Item[]; logs: LogEntry[] }) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export async function getItems(category?: string, location?: string): Promise<Item[]> {
  try {
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
  } catch (err) {
    console.warn('Database offline/credentials issue, using fallback data:', err instanceof Error ? err.message : err);
    const data = getFallbackData();
    let items = data.items;
    if (category) {
      const cat = category.toLowerCase().replace(/[\s-]+/g, '');
      items = items.filter(i => i.category.toLowerCase().replace(/[\s-]+/g, '') === cat);
    }
    if (location) {
      const loc = location.toLowerCase().replace(/[\s-]+/g, '');
      items = items.filter(i => i.location.toLowerCase().replace(/[\s-]+/g, '') === loc);
    }
    return items;
  }
}

export async function getItemBySerial(serial: string): Promise<Item | null> {
  try {
    const item = await prisma.item.findUnique({
      where: { serialNumber: serial },
    });
    if (item) return item;

    const all = await prisma.item.findMany();
    return all.find((i) => i.serialNumber.toLowerCase() === serial.toLowerCase()) || null;
  } catch {
    const data = getFallbackData();
    return data.items.find(i => i.serialNumber.toLowerCase() === serial.toLowerCase()) || null;
  }
}

export async function getItemsByLocation(location: string): Promise<Item[]> {
  try {
    const items = await prisma.item.findMany({
      orderBy: { rack: 'asc' },
    });
    const normalizedTarget = location.toLowerCase().replace(/[\s-]+/g, '');
    return items.filter(
      (item) => item.location.toLowerCase().replace(/[\s-]+/g, '') === normalizedTarget
    );
  } catch {
    const data = getFallbackData();
    const normalizedTarget = location.toLowerCase().replace(/[\s-]+/g, '');
    return data.items.filter(
      (item) => item.location.toLowerCase().replace(/[\s-]+/g, '') === normalizedTarget
    );
  }
}

export async function getLocations(): Promise<string[]> {
  try {
    const items = await prisma.item.findMany({
      select: { location: true },
      distinct: ['location'],
    });
    const dbLocations = items.map((i) => i.location);
    const defaultLocations = ['Module Room'];
    return [...new Set([...defaultLocations, ...dbLocations])];
  } catch {
    const data = getFallbackData();
    const locs = data.items.map(i => i.location);
    return [...new Set(['Module Room', ...locs])];
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const items = await prisma.item.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return items.map((i) => i.category);
  } catch {
    const data = getFallbackData();
    return [...new Set(data.items.map(i => i.category))];
  }
}

export async function updateItemStatus(
  serialNumber: string,
  status: string
): Promise<Item | null> {
  try {
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
    const data = getFallbackData();
    const item = data.items.find(i => i.serialNumber.toLowerCase() === serialNumber.toLowerCase());
    if (item) {
      item.status = status;
      saveFallbackData(data);
      return item;
    }
    return null;
  }
}

export async function addLog(entry: Omit<LogEntry, 'id'>): Promise<LogEntry> {
  try {
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
  } catch {
    const data = getFallbackData();
    const newLog: LogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    data.logs.unshift(newLog);
    saveFallbackData(data);
    return newLog;
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  try {
    const logs = await prisma.logEntry.findMany({
      orderBy: { timestamp: 'desc' },
    });
    return logs;
  } catch {
    const data = getFallbackData();
    return data.logs;
  }
}

export async function getStats() {
  try {
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
  } catch {
    const data = getFallbackData();
    return {
      total: data.items.length,
      available: data.items.filter(i => i.status === 'available').length,
      checkedOut: data.items.filter(i => i.status === 'checked_out').length,
      locations: [...new Set(data.items.map(i => i.location))].length || 1,
      categories: [...new Set(data.items.map(i => i.category))].length || 1,
    };
  }
}

export async function addItem(itemData: Omit<Item, 'id'>): Promise<Item> {
  try {
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
  } catch {
    const data = getFallbackData();
    const newItem: Item = {
      ...itemData,
      id: `item-${Date.now()}`
    };
    data.items.push(newItem);
    saveFallbackData(data);
    return newItem;
  }
}

export async function deleteItem(serialNumber: string): Promise<boolean> {
  try {
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
    const data = getFallbackData();
    const idx = data.items.findIndex(i => i.serialNumber.toLowerCase() === serialNumber.toLowerCase());
    if (idx !== -1) {
      data.items.splice(idx, 1);
      saveFallbackData(data);
      return true;
    }
    return false;
  }
}
