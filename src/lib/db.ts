import { prisma } from './prisma';
import { hashPassword } from './auth';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Item {
  id: string;
  category: string;
  serialNumber: string;
  name: string;
  location: string;
  rack: string;
  status: string;
  quantity: number;
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
  quantity?: number;
}

// Fallback Memory/JSON Store
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'inventory.json');

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'Administrator', password: hashPassword('admin'), role: 'admin' },
  { id: 'u2', username: 'evra', name: 'Evra', password: hashPassword('evra'), role: 'admin' },
  { id: 'u3', username: 'prabu', name: 'Prabu', password: hashPassword('prabu'), role: 'viewer' },
];

function getFallbackData(): { items: Item[]; logs: LogEntry[]; users?: User[] } {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = DEFAULT_USERS;
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return {
    items: [
      { id: '1', category: 'O-Ring', serialNumber: 'BO11870', name: 'O-Ring 50mm NBR', location: 'Module Room', rack: 'Rak - A1', status: 'available', quantity: 25 },
      { id: '2', category: 'O-Ring', serialNumber: 'BO11871', name: 'O-Ring 70mm Viton', location: 'Module Room', rack: 'Rak - B2', status: 'available', quantity: 15 },
      { id: '3', category: 'O-Ring', serialNumber: 'BO11872', name: 'O-Ring 30mm Silicone', location: 'Module Room', rack: 'Rak - C1', status: 'available', quantity: 10 },
      { id: '4', category: 'O-Ring', serialNumber: 'BO11873', name: 'O-Ring 100mm EPDM', location: 'Module Room', rack: 'Rak - D2', status: 'available', quantity: 20 },
      { id: '5', category: 'O-Ring', serialNumber: 'BO11874', name: 'O-Ring 45mm NBR', location: 'Module Room', rack: 'Rak - B4', status: 'available', quantity: 30 },
      { id: '6', category: 'O-Ring', serialNumber: 'BO11875', name: 'O-Ring 60mm Viton', location: 'Module Room', rack: 'Rak - C3', status: 'available', quantity: 8 },
      { id: '7', category: 'O-Ring', serialNumber: 'BO11876', name: 'O-Ring 25mm PTFE', location: 'Module Room', rack: 'Rak - E4', status: 'available', quantity: 12 },
      { id: '8', category: 'O-Ring', serialNumber: 'BO11877', name: 'O-Ring 80mm NBR', location: 'Module Room', rack: 'Rak - B2', status: 'available', quantity: 18 },
      { id: '9', category: 'MRTM-2245', serialNumber: '2245', name: 'MRTM', location: 'Module Room', rack: 'Rak - D4', status: 'checked_out', quantity: 1 },
      { id: '10', category: 'O-Ring', serialNumber: 'BO11880', name: 'O-Ring 40mm FKM', location: 'Module Room', rack: 'Rak - A2', status: 'available', quantity: 5 }
    ],
    logs: [],
    users: DEFAULT_USERS
  };
}

function saveFallbackData(data: { items: Item[]; logs: LogEntry[]; users?: User[] }) {
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
    const defaultLocations = ['Module Room', 'Lab'];
    return [...new Set([...defaultLocations, ...dbLocations])];
  } catch {
    const data = getFallbackData();
    const locs = data.items.map(i => i.location);
    return [...new Set(['Module Room', 'Lab', ...locs])];
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

export async function updateItem(
  originalSerial: string,
  data: Partial<Omit<Item, 'id'>>
): Promise<Item | null> {
  try {
    const all = await prisma.item.findMany();
    const found = all.find(
      (i) => i.serialNumber.toLowerCase() === originalSerial.toLowerCase()
    );
    if (!found) return null;

    const updateData: {
      serialNumber?: string;
      name?: string;
      category?: string;
      location?: string;
      rack?: string;
      quantity?: number;
      status?: string;
    } = {};

    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber.trim();
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.location !== undefined) updateData.location = data.location.trim();
    if (data.rack !== undefined) updateData.rack = data.rack.trim();
    if (data.quantity !== undefined) {
      updateData.quantity = Math.max(0, data.quantity);
      if (data.status === undefined) {
        updateData.status = updateData.quantity <= 0 ? 'checked_out' : 'available';
      }
    }
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.item.update({
      where: { id: found.id },
      data: updateData,
    });
    return updated;
  } catch (err) {
    console.warn('DB update failed, using fallback:', err);
    const fallback = getFallbackData();
    const item = fallback.items.find(
      (i) => i.serialNumber.toLowerCase() === originalSerial.toLowerCase()
    );
    if (item) {
      if (data.serialNumber !== undefined) item.serialNumber = data.serialNumber.trim();
      if (data.name !== undefined) item.name = data.name.trim();
      if (data.category !== undefined) item.category = data.category.trim();
      if (data.location !== undefined) item.location = data.location.trim();
      if (data.rack !== undefined) item.rack = data.rack.trim();
      if (data.quantity !== undefined) {
        item.quantity = Math.max(0, data.quantity);
        if (data.status === undefined) {
          item.status = item.quantity <= 0 ? 'checked_out' : 'available';
        }
      }
      if (data.status !== undefined) item.status = data.status;
      saveFallbackData(fallback);
      return item;
    }
    return null;
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
        quantity: entry.quantity || 1,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      },
    });
    return log;
  } catch {
    const data = getFallbackData();
    const newLog: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      quantity: entry.quantity || 1,
      timestamp: new Date().toISOString()
    };
    data.logs.unshift(newLog);
    saveFallbackData(data);
    return newLog;
  }
}

export async function clearLogs(): Promise<boolean> {
  try {
    await prisma.logEntry.deleteMany();
    const data = getFallbackData();
    data.logs = [];
    saveFallbackData(data);
    return true;
  } catch (err) {
    console.warn('DB clear logs failed, clearing fallback:', err);
    const data = getFallbackData();
    data.logs = [];
    saveFallbackData(data);
    return true;
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
    const items = await prisma.item.findMany();
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const availableQty = items.filter(i => i.status === 'available').reduce((sum, i) => sum + (i.quantity || 0), 0);
    const checkedOutQty = totalQty - availableQty;
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
      total: totalQty,
      available: availableQty,
      checkedOut: checkedOutQty,
      locations,
      categories,
    };
  } catch {
    const data = getFallbackData();
    const totalQty = data.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const availableQty = data.items.filter(i => i.status === 'available').reduce((sum, i) => sum + (i.quantity || 0), 0);
    return {
      total: totalQty,
      available: availableQty,
      checkedOut: totalQty - availableQty,
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
        quantity: itemData.quantity || 1,
      },
    });
    return newItem;
  } catch {
    const data = getFallbackData();
    const newItem: Item = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      quantity: itemData.quantity || 1
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

// Update item quantity by delta (negative = subtract, positive = add)
// Also updates status: quantity 0 → checked_out, quantity > 0 → available
export async function updateItemQuantity(
  serialNumber: string,
  delta: number
): Promise<Item | null> {
  try {
    const all = await prisma.item.findMany();
    const found = all.find(
      (i) => i.serialNumber.toLowerCase() === serialNumber.toLowerCase()
    );
    if (!found) return null;

    const newQty = Math.max(0, (found.quantity || 0) + delta);
    const newStatus = newQty <= 0 ? 'checked_out' : 'available';

    const updated = await prisma.item.update({
      where: { id: found.id },
      data: { quantity: newQty, status: newStatus },
    });
    return updated;
  } catch {
    const data = getFallbackData();
    const item = data.items.find(i => i.serialNumber.toLowerCase() === serialNumber.toLowerCase());
    if (item) {
      item.quantity = Math.max(0, (item.quantity || 0) + delta);
      item.status = item.quantity <= 0 ? 'checked_out' : 'available';
      saveFallbackData(data);
      return item;
    }
    return null;
  }
}

// ================= USER MANAGEMENT =================

export async function ensureDefaultUsers(): Promise<void> {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      for (const u of DEFAULT_USERS) {
        await prisma.user.create({
          data: {
            username: u.username,
            name: u.name,
            password: u.password!,
            role: u.role,
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to ensure default users in database:', err);
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    await ensureDefaultUsers();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users as User[];
  } catch {
    const data = getFallbackData();
    return (data.users || DEFAULT_USERS).map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt || new Date().toISOString(),
    }));
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    await ensureDefaultUsers();
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    return user as User | null;
  } catch {
    const data = getFallbackData();
    const found = (data.users || DEFAULT_USERS).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    return found || null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return user as User | null;
  } catch {
    const data = getFallbackData();
    const found = (data.users || DEFAULT_USERS).find(u => u.id === id);
    return found || null;
  }
}

export async function createUser(data: {
  username: string;
  name: string;
  password: string;
  role: string;
}): Promise<User | null> {
  const hashedPassword = hashPassword(data.password);
  const usernameClean = data.username.trim().toLowerCase();

  try {
    const created = await prisma.user.create({
      data: {
        username: usernameClean,
        name: data.name.trim(),
        password: hashedPassword,
        role: data.role === 'admin' ? 'admin' : 'viewer',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return created as User;
  } catch {
    const fb = getFallbackData();
    if (!fb.users) fb.users = [...DEFAULT_USERS];
    if (fb.users.some(u => u.username.toLowerCase() === usernameClean)) {
      return null;
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: usernameClean,
      name: data.name.trim(),
      password: hashedPassword,
      role: data.role === 'admin' ? 'admin' : 'viewer',
      createdAt: new Date().toISOString(),
    };
    fb.users.push(newUser);
    saveFallbackData(fb);
    return {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: string; password?: string }
): Promise<User | null> {
  const updateData: Record<string, string> = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.role) updateData.role = data.role === 'admin' ? 'admin' : 'viewer';
  if (data.password && data.password.trim().length > 0) {
    updateData.password = hashPassword(data.password.trim());
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated as User;
  } catch {
    const fb = getFallbackData();
    if (!fb.users) fb.users = [...DEFAULT_USERS];
    const idx = fb.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      fb.users[idx] = {
        ...fb.users[idx],
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.role ? { role: data.role === 'admin' ? 'admin' : 'viewer' } : {}),
        ...(data.password ? { password: hashPassword(data.password.trim()) } : {}),
        updatedAt: new Date().toISOString(),
      };
      saveFallbackData(fb);
      return {
        id: fb.users[idx].id,
        username: fb.users[idx].username,
        name: fb.users[idx].name,
        role: fb.users[idx].role,
      };
    }
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.user.delete({ where: { id } });
    return true;
  } catch {
    const fb = getFallbackData();
    if (!fb.users) fb.users = [...DEFAULT_USERS];
    const idx = fb.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      fb.users.splice(idx, 1);
      saveFallbackData(fb);
      return true;
    }
    return false;
  }
}
