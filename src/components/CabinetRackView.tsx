'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import ContactAdminModal from './ContactAdminModal';

export interface InventoryItem {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  location: string;
  rack: string;
  status: string;
  quantity: number;
}

interface CabinetRackViewProps {
  locationName: string;
  locationSlug: string;
  items: InventoryItem[];
}

// 4 Columns x 8 Rows = 32 Laci (Module Room)
const CABINET_CONFIG = {
  id: 'cab-1',
  name: 'LEMARI RAK',
  rackPrefix: 'Rak',
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], // 8 Baris: A, B, C, D, E, F, G, H
  cols: [1, 2, 3, 4],                             // 4 Kolom: 1, 2, 3, 4
};

// 3 Lemari di Lokasi Lab dengan 4 Sekat = 5 Tingkat Rak
export interface LabShelf {
  index: number;
  name: string;
  subtitle: string;
  label?: string;
  tagColor?: string;
}

export interface LabCabinetConfig {
  id: number;
  name: string;
  shortName: string;
  tagline: string;
  colorTheme: 'blue' | 'lightGray' | 'offWhite';
  doorLabels?: {
    topRight?: string;
    bottomRight?: string[];
  };
  shelves: LabShelf[];
}

const LAB_CABINETS: LabCabinetConfig[] = [
  {
    id: 1,
    name: 'Lemari 1',
    shortName: 'Lemari 1',
    tagline: 'Lemari Besi 2 Pintu',
    colorTheme: 'blue',
    doorLabels: {
      topRight: 'SLS 1 Kit MDT',
      bottomRight: ['SLS Kit MSCT - XLR', 'SLS Kit XPT'],
    },
    shelves: [
      { index: 1, name: 'Tingkat 1', subtitle: 'Rak 1' },
      { index: 2, name: 'Tingkat 2', subtitle: 'Rak 2' },
      { index: 3, name: 'Tingkat 3', subtitle: 'Rak 3' },
      { index: 4, name: 'Tingkat 4', subtitle: 'Rak 4' },
      { index: 5, name: 'Tingkat 5', subtitle: 'Rak 5' },
    ],
  },
  {
    id: 2,
    name: 'Lemari 2',
    shortName: 'Lemari 2',
    tagline: 'Lemari Besi Putih',
    colorTheme: 'lightGray',
    shelves: [
      { index: 1, name: 'Tingkat 1', subtitle: 'Rak 1' },
      { index: 2, name: 'Tingkat 2', subtitle: 'Rak 2' },
      { index: 3, name: 'Tingkat 3', subtitle: 'Rak 3' },
      { index: 4, name: 'Tingkat 4', subtitle: 'Rak 4' },
      { index: 5, name: 'Tingkat 5', subtitle: 'Rak 5' },
    ],
  },
  {
    id: 3,
    name: 'Lemari 3',
    shortName: 'Lemari 3',
    tagline: 'Lemari Besi Putih',
    colorTheme: 'offWhite',
    shelves: [
      { index: 1, name: 'Tingkat 1', subtitle: 'Rak 1' },
      { index: 2, name: 'Tingkat 2', subtitle: 'Rak 2' },
      { index: 3, name: 'Tingkat 3', subtitle: 'Rak 3' },
      { index: 4, name: 'Tingkat 4', subtitle: 'Rak 4' },
      { index: 5, name: 'Tingkat 5', subtitle: 'Rak 5' },
    ],
  },
];

export default function CabinetRackView({
  locationName,
  locationSlug,
  items: initialItems,
}: CabinetRackViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [role, setRole] = useState<string | null>(null);

  const isLab = locationSlug.toLowerCase() === 'lab' || locationName.toLowerCase() === 'lab';
  const [doorsOpenMap, setDoorsOpenMap] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  const rackOptions = useMemo(() => {
    if (isLab) {
      return LAB_CABINETS.flatMap((cab) =>
        cab.shelves.map((s) => `Lemari ${cab.id} - ${s.name}`)
      );
    }
    return CABINET_CONFIG.rows.flatMap((r) =>
      CABINET_CONFIG.cols.map((c) => `Rak - ${r}${c}`)
    );
  }, [isLab]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      setRole(roleCookie.split('=')[1]);
    }
  }, []);

  const activeCabinet = CABINET_CONFIG;

  const [selectedSlot, setSelectedSlot] = useState<{
    cabinetName: string;
    slotLabel: string;
    fullRackKey: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cabinet' | 'list'>('cabinet');

  // Admin inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    category: '',
    status: 'available',
    quantity: 1,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  // Admin inline edit state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    serialNumber: '',
    name: '',
    category: '',
    quantity: 1,
    rack: '',
    status: 'available',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Contact Admin popup state (for non-admin users trying to take items)
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [contactAdminItem, setContactAdminItem] = useState<InventoryItem | null>(null);

  // Normalize rack mapping
  const slotItemsMap = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};

    items.forEach((item) => {
      const rackRaw = item.rack.trim();
      const key = rackRaw.toUpperCase();
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });

    return map;
  }, [items]);

  // Find slot that matches the search query to highlight it with the glowing pointer
  const highlightedSlot = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchedItem = items.find(
      (i) =>
        i.serialNumber.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.rack.toLowerCase().includes(q)
    );

    if (matchedItem) {
      return matchedItem.rack.toUpperCase();
    }
    return null;
  }, [searchQuery, items]);

  useEffect(() => {
    if (highlightedSlot && isLab) {
      const r = highlightedSlot.toLowerCase();
      if (r.includes('lemari 3') || r.includes('l3') || r.includes('kanan')) {
        setDoorsOpenMap((p) => ({ ...p, 3: true }));
      } else if (r.includes('lemari 2') || r.includes('l2') || r.includes('tengah')) {
        setDoorsOpenMap((p) => ({ ...p, 2: true }));
      } else {
        setDoorsOpenMap((p) => ({ ...p, 1: true }));
      }
    }
  }, [highlightedSlot, isLab]);

  // Helper: filter items by Lab cabinet (1, 2, 3) and shelf (1, 2, 3, 4, 5)
  const getItemsInLabShelf = (cabinetId: number, shelfIndex: number) => {
    return items.filter((item) => {
      const r = item.rack.toLowerCase().trim();

      const isCab1 = r.includes('lemari 1') || r.includes('l1') || r.includes('lemari-1') || r.includes('biru');
      const isCab2 = r.includes('lemari 2') || r.includes('l2') || r.includes('lemari-2') || r.includes('tengah');
      const isCab3 = r.includes('lemari 3') || r.includes('l3') || r.includes('lemari-3') || r.includes('kanan');

      // Default to cabinet 1 if not specified
      const itemCab = isCab3 ? 3 : isCab2 ? 2 : isCab1 ? 1 : 1;
      if (itemCab !== cabinetId) return false;

      const targetStr = String(shelfIndex);
      return (
        r.includes(`tingkat ${targetStr}`) ||
        r.includes(`tingkat-${targetStr}`) ||
        r.includes(`t${targetStr}`) ||
        r.includes(`rak ${targetStr}`) ||
        r.includes(`sekat ${targetStr}`)
      );
    });
  };

  const getLabCabinetItemCount = (cabinetId: number) => {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      total += getItemsInLabShelf(cabinetId, i).length;
    }
    return total;
  };

  // Helper to get items in a specific slot (matches Lab shelves or Module Room drawers)
  const getItemsInSlot = (slotCode: string, cabinetId: number = 1) => {
    if (isLab) {
      const match = slotCode.match(/(\d+)/);
      const shelfNum = match ? parseInt(match[1]) : 1;
      return getItemsInLabShelf(cabinetId, shelfNum);
    }

    const directKey = `RAK - ${slotCode}`.toUpperCase();
    const altKey1 = `RAK ${slotCode}`.toUpperCase();
    const altKey2 = slotCode.toUpperCase();

    if (slotItemsMap[directKey]?.length) return slotItemsMap[directKey];
    if (slotItemsMap[altKey1]?.length) return slotItemsMap[altKey1];
    if (slotItemsMap[altKey2]?.length) return slotItemsMap[altKey2];

    for (const key of Object.keys(slotItemsMap)) {
      if (key.includes(slotCode.toUpperCase())) {
        return slotItemsMap[key];
      }
    }

    return [];
  };

  const selectedSlotItems = useMemo(() => {
    if (!selectedSlot) return [];
    if (isLab) {
      const cabMatch = selectedSlot.fullRackKey.match(/lemari\s*(\d+)/i) || selectedSlot.cabinetName.match(/lemari\s*(\d+)/i);
      const cabId = cabMatch ? parseInt(cabMatch[1]) : 1;
      const shelfMatch = selectedSlot.slotLabel.match(/(\d+)/);
      const shelfIndex = shelfMatch ? parseInt(shelfMatch[1]) : 1;
      return getItemsInLabShelf(cabId, shelfIndex);
    }
    return getItemsInSlot(selectedSlot.slotLabel);
  }, [selectedSlot, slotItemsMap, isLab, items]);

  // Handle direct item addition by Admin into the clicked slot
  const handleDirectAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setFormLoading(true);
    setFormMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: formData.serialNumber.trim(),
          name: formData.name.trim(),
          category: formData.category.trim(),
          location: locationName,
          rack: selectedSlot.fullRackKey,
          status: formData.status,
          quantity: formData.quantity || 1,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const addedItems: InventoryItem[] = result.items || [result];
        setFormMsg({
          text: `Berhasil menambahkan ${addedItems.length} barang ke laci ini!`,
          type: 'success',
        });
        setFormData({
          serialNumber: '',
          name: '',
          category: '',
          status: 'available',
          quantity: 1,
        });
        setItems((prev) => [...prev, ...addedItems]);
        router.refresh();
      } else {
        const err = await res.json();
        setFormMsg({ text: err.error || 'Gagal menambahkan barang', type: 'error' });
      }
    } catch {
      setFormMsg({ text: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle direct item deletion by Admin
  const handleDeleteItem = async (serialNumber: string) => {
    if (!confirm(`Hapus barang dengan Plat Number "${serialNumber}" dari slot ini?`)) return;

    try {
      const res = await fetch(`/api/items/${serialNumber}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.serialNumber !== serialNumber));
        router.refresh();
      } else {
        alert('Gagal menghapus barang');
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    }
  };

  // Handle direct item editing by Admin
  const handleStartEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      serialNumber: item.serialNumber,
      name: item.name,
      category: item.category,
      quantity: item.quantity ?? 1,
      rack: item.rack,
      status: item.status,
    });
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`/api/items/${editingItem.serialNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: editFormData.serialNumber.trim(),
          name: editFormData.name.trim(),
          category: editFormData.category.trim(),
          quantity: Math.max(0, editFormData.quantity),
          rack: editFormData.rack.trim(),
          status: editFormData.status,
        }),
      });

      if (res.ok) {
        const updated: InventoryItem = await res.json();
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id ||
            i.serialNumber.toLowerCase() === editingItem.serialNumber.toLowerCase()
              ? updated
              : i
          )
        );
        setEditingItem(null);
        router.refresh();
      } else {
        const data = await res.json();
        setEditError(data.error || 'Gagal menyimpan perubahan');
      }
    } catch {
      setEditError('Terjadi kesalahan koneksi');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Search & View Switcher */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Plat Number atau Nama Barang..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
          <svg
            className="w-4 h-4 absolute left-3.5 top-3 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded hover:bg-slate-300 font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('cabinet')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'cabinet'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Tampilan Lemari
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Tampilan Daftar
            </button>
          </div>
        </div>
      </div>

      {/* Mode: Visual Cabinet (Single Focused 4x6 Unit) */}
      {viewMode === 'cabinet' && (
        <div className="space-y-4">
          {/* Legend indicator */}
          <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Checked Out
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span> Target
            </span>
          </div>

          {/* Centered Cabinet Shell */}
          <div className="flex justify-center">
            {isLab ? (
              /* ======================================================== */
              /* 3 LEMARI LAB DENGAN 4 SEKAT = 5 TINGKAT                  */
              /* ======================================================== */
              <div className="w-full max-w-[1700px] mx-auto">
                {/* 3 Lemari Ditampilkan Langsung Berdampingan (Ukuran Besar & Bersih) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-start">
                  {LAB_CABINETS.map((cabinet) => {
                    const isBlueTheme = cabinet.colorTheme === 'blue';
                    const isDoorsOpen = doorsOpenMap[cabinet.id] ?? true;
                    const count = getLabCabinetItemCount(cabinet.id);

                    return (
                      <div
                        key={cabinet.id}
                        className={`w-full rounded-3xl p-4 sm:p-5 border-4 shadow-2xl text-slate-800 transition-all ${
                          isBlueTheme
                            ? 'bg-[#395773] border-[#2b445c]'
                            : 'bg-[#94a3b8] border-[#64748b]'
                        }`}
                      >
                        {/* Top Cream / Silver Bevel Header */}
                        <div
                          className={`border-b-2 rounded-t-2xl px-4 py-3 flex items-center justify-between shadow-sm ${
                            isBlueTheme
                              ? 'bg-[#e4e0d5] border-slate-400 text-slate-800'
                              : 'bg-[#f1f5f9] border-slate-300 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                                isBlueTheme ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-slate-500 ring-2 ring-slate-300'
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="font-black text-sm sm:text-base tracking-wider uppercase truncate block text-slate-900">
                                {cabinet.name}
                              </span>
                              <span className="text-xs text-slate-600 font-bold block">
                                4 Sekat • 5 Tingkat Rak
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setDoorsOpenMap((prev) => ({
                                ...prev,
                                [cabinet.id]: !isDoorsOpen,
                              }))
                            }
                            className={`shrink-0 px-3.5 py-1.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 ${
                              isBlueTheme
                                ? 'bg-blue-700 hover:bg-blue-800 ring-1 ring-blue-400/50'
                                : 'bg-slate-700 hover:bg-slate-800 ring-1 ring-slate-400/50'
                            }`}
                          >
                            <span>{isDoorsOpen ? 'Tutup Pintu' : 'Buka Pintu'}</span>
                          </button>
                        </div>

                        {/* Cabinet Main Body */}
                        <div className="relative mt-2.5 rounded-b-2xl overflow-hidden border-2 border-slate-700 shadow-inner bg-slate-900">
                          {!isDoorsOpen ? (
                            /* ------------------------------------------------ */
                            /* PINTU TERTUTUP (UKURAN BESAR & REALISTIS)        */
                            /* ------------------------------------------------ */
                            <div
                              onClick={() =>
                                setDoorsOpenMap((prev) => ({
                                  ...prev,
                                  [cabinet.id]: true,
                                }))
                              }
                              className={`relative h-[680px] sm:h-[780px] cursor-pointer group flex select-none ${
                                isBlueTheme
                                  ? 'bg-gradient-to-r from-[#446584] via-[#527494] to-[#42617f]'
                                  : 'bg-gradient-to-r from-[#cbd5e1] via-[#e2e8f0] to-[#cbd5e1]'
                              }`}
                            >
                              {/* Left Door */}
                              <div
                                className={`w-1/2 h-full border-r-2 relative ${
                                  isBlueTheme
                                    ? 'border-slate-900/60 bg-gradient-to-b from-[#4d6f8f] via-[#527494] to-[#3f5d79]'
                                    : 'border-slate-400 bg-gradient-to-b from-[#d8dce2] via-[#e5e9f0] to-[#cbd2dc]'
                                }`}
                              >
                                <div
                                  className={`absolute top-5 left-5 text-xs font-mono font-bold tracking-wider ${
                                    isBlueTheme ? 'text-white/40' : 'text-slate-500'
                                  }`}
                                >
                                  PINTU KIRI
                                </div>
                                {!isBlueTheme && (
                                  <div className="absolute top-1/3 right-4 w-4 h-28 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-400 rounded-sm border border-slate-500 shadow-inner" />
                                )}
                              </div>

                              {/* Right Door */}
                              <div
                                className={`w-1/2 h-full relative ${
                                  isBlueTheme
                                    ? 'bg-gradient-to-b from-[#4d6f8f] via-[#527494] to-[#3f5d79]'
                                    : 'bg-gradient-to-b from-[#d8dce2] via-[#e5e9f0] to-[#cbd2dc]'
                                }`}
                              >
                                <div
                                  className={`absolute top-5 right-5 text-xs font-mono font-bold tracking-wider ${
                                    isBlueTheme ? 'text-white/40' : 'text-slate-500'
                                  }`}
                                >
                                  PINTU KANAN
                                </div>

                                {!isBlueTheme && (
                                  <div className="absolute top-1/3 left-4 w-4 h-28 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-400 rounded-sm border border-slate-500 shadow-inner" />
                                )}

                                {/* Stickers on Right Door (Only Lemari 1 Biru) */}
                                {isBlueTheme && (
                                  <>
                                    <div className="absolute top-14 right-6 sm:right-10 bg-white/95 px-4 py-2 rounded shadow-lg border border-slate-300 font-sans font-black text-sm text-slate-900 tracking-wider ring-1 ring-black/10 transform group-hover:scale-105 transition-transform">
                                      SLS 1 Kit MDT
                                    </div>
                                    <div className="absolute bottom-16 right-6 sm:right-10 space-y-2.5 transform group-hover:scale-105 transition-transform">
                                      <div className="bg-white/95 px-3.5 py-1.5 rounded shadow-md border border-slate-300 font-sans font-bold text-xs text-slate-900 tracking-wider ring-1 ring-black/10">
                                        SLS Kit MSCT - XLR
                                      </div>
                                      <div className="bg-white/95 px-3.5 py-1.5 rounded shadow-md border border-slate-300 font-sans font-bold text-xs text-slate-900 tracking-wider ring-1 ring-black/10">
                                        SLS Kit XPT
                                      </div>
                                    </div>
                                  </>
                                )}

                                {!isBlueTheme && (
                                  <div className="absolute top-14 right-6 bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 shadow-sm">
                                    {cabinet.name}
                                  </div>
                                )}
                              </div>

                              {/* Center Lock Mechanism for Lemari Biru */}
                              {isBlueTheme && (
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                                  <div className="w-10 h-32 bg-zinc-950 border-2 border-zinc-700 rounded-lg shadow-2xl flex flex-col items-center justify-between py-3">
                                    <div className="w-4 h-14 bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 rounded-sm shadow border border-zinc-500" />
                                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-black rounded-sm" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Hover Overlay Hint */}
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors flex items-center justify-center p-4 text-center">
                                <div
                                  className={`px-4 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl shadow-2xl border backdrop-blur-md group-hover:scale-105 transition-all flex items-center gap-2 ${
                                    isBlueTheme
                                      ? 'bg-blue-950/90 border-blue-400/50'
                                      : 'bg-slate-900/90 border-slate-400/50'
                                  }`}
                                >
                                  <span>Klik Buka Lemari</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ------------------------------------------------ */
                            /* PINTU TERBUKA (4 SEKAT = 5 TINGKAT RAK BESAR)    */
                            /* ------------------------------------------------ */
                            <div className="flex bg-slate-950 min-h-[680px] sm:min-h-[780px]">
                              {/* Left Open Door Flap */}
                              <div
                                className={`w-7 sm:w-10 border-r-2 border-slate-900 shadow-2xl flex flex-col justify-between py-6 items-center select-none text-[9px] font-mono [writing-mode:vertical-lr] rotate-180 font-bold ${
                                  isBlueTheme
                                    ? 'bg-gradient-to-r from-[#2f4961] to-[#456686] text-white/50'
                                    : 'bg-gradient-to-r from-[#94a3b8] to-[#cbd5e1] text-slate-700'
                                }`}
                              >
                                <span>PINTU KIRI</span>
                                <div className="w-2 h-8 bg-zinc-800 rounded" />
                              </div>

                              {/* Main Interior: 5 Shelves divided by 4 Sekat */}
                              <div className="flex-1 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 p-3 sm:p-4 space-y-3">
                                {cabinet.shelves.map((shelf, shelfIdx) => {
                                  const shelfItems = getItemsInLabShelf(cabinet.id, shelf.index);
                                  const hasItems = shelfItems.length > 0;
                                  const totalQty = shelfItems.reduce(
                                    (acc, i) => acc + (i.quantity || 0),
                                    0
                                  );
                                  const isAvailable = shelfItems.some(
                                    (i) => i.status === 'available' && (i.quantity || 0) > 0
                                  );
                                  const isSelected =
                                    selectedSlot?.slotLabel === shelf.name &&
                                    (selectedSlot?.fullRackKey.includes(`Lemari ${cabinet.id}`) ||
                                      selectedSlot?.cabinetName.includes(`LEMARI ${cabinet.id}`));

                                  const isHighlighted =
                                    highlightedSlot &&
                                    (highlightedSlot
                                      .toLowerCase()
                                      .includes(`lemari ${cabinet.id}`) ||
                                      highlightedSlot.toLowerCase().includes(`l${cabinet.id}`)) &&
                                    (highlightedSlot
                                      .toLowerCase()
                                      .includes(shelf.name.toLowerCase()) ||
                                      highlightedSlot.toLowerCase().includes(`t${shelf.index}`));

                                  return (
                                    <div key={shelf.name} className="space-y-2.5">
                                      <div
                                        className={`relative rounded-xl border-2 transition-all duration-200 bg-white/95 shadow-sm overflow-hidden ${
                                          isSelected
                                            ? 'border-blue-600 ring-2 ring-blue-300 shadow-md scale-[1.01]'
                                            : isHighlighted
                                            ? 'border-purple-600 ring-2 ring-purple-300 animate-pulse scale-[1.01]'
                                            : 'border-slate-300 hover:border-blue-400 hover:shadow-md'
                                        }`}
                                      >
                                        {/* Shelf Top Header */}
                                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-mono text-xs sm:text-sm font-black bg-blue-900 text-white px-2 py-0.5 rounded shadow-sm shrink-0">
                                              {shelf.name.toUpperCase()}
                                            </span>
                                            <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                                              {shelf.subtitle}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                hasItems
                                                  ? isAvailable
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-rose-100 text-rose-800'
                                                  : 'bg-slate-100 text-slate-500'
                                              }`}
                                            >
                                              <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                  hasItems
                                                    ? isAvailable
                                                      ? 'bg-emerald-500 animate-pulse'
                                                      : 'bg-rose-500'
                                                    : 'bg-slate-400'
                                                }`}
                                              />
                                              {hasItems ? (isAvailable ? 'Tersedia' : 'Habis') : 'Kosong'}
                                            </span>

                                            <button
                                              onClick={() => {
                                                setSelectedSlot({
                                                  cabinetName: cabinet.name.toUpperCase(),
                                                  slotLabel: shelf.name,
                                                  fullRackKey: `Lemari ${cabinet.id} - ${shelf.name}`,
                                                });
                                                setShowAddForm(false);
                                                setFormMsg({ text: '', type: '' });
                                              }}
                                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1 active:scale-95"
                                            >
                                              <span>Buka Tingkat</span>
                                              <span>→</span>
                                            </button>
                                          </div>
                                        </div>

                                        {/* Shelf Bay (Items on Shelf) */}
                                        <div
                                          onClick={() => {
                                            setSelectedSlot({
                                              cabinetName: cabinet.name.toUpperCase(),
                                              slotLabel: shelf.name,
                                              fullRackKey: `Lemari ${cabinet.id} - ${shelf.name}`,
                                            });
                                            setShowAddForm(false);
                                            setFormMsg({ text: '', type: '' });
                                          }}
                                          className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 min-h-[85px] sm:min-h-[95px] cursor-pointer hover:bg-blue-50/40 transition-colors"
                                        >
                                          {shelfItems.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                              {shelfItems.map((item) => (
                                                <div
                                                  key={item.id || item.serialNumber}
                                                  className="bg-white border border-slate-300 hover:border-blue-400 rounded-lg p-2.5 shadow-sm flex items-center gap-3 transition-all"
                                                >
                                                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1.5">
                                                      <span className="font-mono text-xs sm:text-sm font-bold text-blue-900 truncate">
                                                        {item.serialNumber}
                                                      </span>
                                                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold shrink-0">
                                                        {item.quantity ?? 1} pcs
                                                      </span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-semibold text-slate-800 block truncate">
                                                      {item.name}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                              <span className="text-xs text-blue-600 font-bold ml-auto">
                                                Total {totalQty} pcs
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center py-4 text-slate-400 text-xs sm:text-sm font-medium border border-dashed border-slate-300 rounded-xl">
                                              <span>{shelf.name} belum terisi barang</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Indicator pointer if search targeted this slot */}
                                        {isHighlighted && (
                                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-bounce z-20">
                                            <span className="text-red-500 text-xl font-black drop-shadow-md">
                                              ▼
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* 4 Sekat / Divider Beams between the 5 shelves */}
                                      {shelfIdx < 4 && (
                                        <div className="h-3.5 sm:h-4 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-y-2 border-slate-500 shadow-sm rounded flex items-center justify-between px-3 select-none">
                                          <span className="text-[9px] sm:text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider">
                                            SEKAT {shelfIdx + 1}
                                          </span>
                                          <span className="text-[9px] sm:text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider">
                                            SEKAT {shelfIdx + 1}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Right Open Door Flap */}
                              <div
                                className={`w-7 sm:w-10 border-l-2 border-slate-900 shadow-2xl flex flex-col justify-between py-6 items-center select-none ${
                                  isBlueTheme
                                    ? 'bg-gradient-to-r from-[#456686] to-[#2f4961] text-white/50'
                                    : 'bg-gradient-to-r from-[#cbd5e1] to-[#94a3b8] text-slate-700'
                                }`}
                              >
                                {isBlueTheme ? (
                                  <>
                                    <div className="bg-white text-slate-900 text-[8px] font-black px-1 py-0.5 rounded shadow scale-90 origin-top text-center">
                                      SLS 1
                                    </div>
                                    <div className="space-y-1.5 scale-90 origin-bottom text-center">
                                      <div className="bg-white text-slate-900 text-[7px] font-bold px-1 py-0.5 rounded shadow">
                                        MSCT
                                      </div>
                                      <div className="bg-white text-slate-900 text-[7px] font-bold px-1 py-0.5 rounded shadow">
                                        XPT
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-[9px] font-mono text-slate-600 font-bold text-center [writing-mode:vertical-lr]">
                                    PINTU {cabinet.id}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* LEMARI MODULE ROOM (32 LACI)                             */
              /* ======================================================== */
              <div className="w-full max-w-xl rounded-3xl p-5 sm:p-7 border-4 shadow-2xl transition-all bg-gradient-to-b from-slate-900 via-zinc-900 to-black border-slate-700 text-white shadow-black/80">
                {/* 4 Columns x 8 Rows Matrix Container */}
                <div className="grid grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-2xl border-2 bg-zinc-900/70 border-slate-800/80 shadow-inner">
                  {activeCabinet.rows.map((row) =>
                    activeCabinet.cols.map((col) => {
                      const slotCode = `${row}${col}`;
                      const slotItems = getItemsInSlot(slotCode);
                      const hasItems = slotItems.length > 0;
                      const isAvailable = slotItems.some((i) => i.status === 'available');
                      const isCheckedOut =
                        hasItems && slotItems.every((i) => i.status === 'checked_out');

                      // Search highlight
                      const isHighlighted =
                        highlightedSlot &&
                        (highlightedSlot.includes(slotCode) ||
                          highlightedSlot === `RAK - ${slotCode}`.toUpperCase() ||
                          highlightedSlot === `RAK ${slotCode}`.toUpperCase() ||
                          highlightedSlot === slotCode.toUpperCase());

                      const isSelected = selectedSlot?.slotLabel === slotCode;

                      return (
                        <button
                          key={slotCode}
                          onClick={() => {
                            setSelectedSlot({
                              cabinetName: activeCabinet.name,
                              slotLabel: slotCode,
                              fullRackKey: `Rak - ${slotCode}`,
                            });
                            setShowAddForm(false);
                            setFormMsg({ text: '', type: '' });
                          }}
                          className={`relative h-16 sm:h-20 rounded-xl transition-all duration-150 flex flex-col items-center justify-between p-2 font-mono select-none group border-2 ${
                            isSelected
                              ? 'bg-blue-500 text-white ring-4 ring-blue-300 scale-105 z-10 font-black shadow-xl border-white'
                              : isHighlighted
                              ? 'bg-purple-600 text-white ring-4 ring-purple-400 animate-pulse scale-105 z-10 shadow-lg shadow-purple-500/50 border-purple-300'
                              : hasItems
                              ? 'bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white shadow-md border-blue-400/40 hover:scale-[1.03]'
                              : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400 hover:text-slate-200 border-slate-700/50 hover:bg-slate-700/60'
                          }`}
                        >
                          {/* Drawer Label Plate */}
                          <div
                            className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-sm transition-colors ${
                              isSelected
                                ? 'bg-slate-950 text-amber-300'
                                : hasItems
                                ? 'bg-blue-100 text-blue-950 border border-blue-300'
                                : 'bg-black/40 text-slate-300 border border-white/10'
                            }`}
                          >
                            {slotCode}
                          </div>

                          {/* Center Knob */}
                          <div className="flex items-center justify-center my-auto">
                            <div className="w-4 h-4 rounded-full shadow-md flex items-center justify-center border bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-white shadow-black/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
                            </div>
                          </div>

                          {/* Status Indicator Dot / Item Count Badge */}
                          {hasItems ? (
                            <div className="flex items-center space-x-1 w-full justify-end">
                              {isAvailable && (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-emerald-950 shadow-sm animate-pulse"></span>
                              )}
                              {isCheckedOut && (
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-1 ring-rose-950 shadow-sm"></span>
                              )}
                              {slotItems.length > 1 && (
                                <span className="text-[9px] bg-black/80 text-white px-1.5 rounded-full font-bold">
                                  {slotItems.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-2.5"></div>
                          )}

                          {/* Indicator pointer if search targeted this slot */}
                          {isHighlighted && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-bounce z-20">
                              <span className="text-red-500 text-2xl font-black leading-none drop-shadow-md">
                                ▼
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode: List View fallback */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isORing = item.category.toLowerCase() === 'o-ring';
            const isCheckedOut = item.status === 'checked_out';

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-blue-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-blue-900">{item.serialNumber}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        item.quantity > 0 && item.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        Sisa: {item.quantity || 0} pcs
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.name}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {item.rack}
                  </span>

                  {isCheckedOut && isORing ? (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                      Habis Pakai
                    </span>
                  ) : role === 'admin' ? (
                    <Link
                      href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=${
                        item.status === 'available' ? 'checkout' : 'return'
                      }`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {item.status === 'available' ? 'Ambil' : 'Kembalikan'} →
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setContactAdminItem(item);
                        setShowContactAdmin(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {item.status === 'available' ? 'Ambil' : 'Kembalikan'} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Popup Detail Slot saat laci diklik */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="text-white p-5 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-900 to-slate-950">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-mono font-black shadow-inner bg-blue-700/80 border-blue-400/40 text-blue-100">
                  <span className="text-sm font-bold">{isLab ? selectedSlot.slotLabel.replace('Tingkat ', 'T') : selectedSlot.slotLabel}</span>
                  <span className="text-[9px]">{isLab ? 'TINGKAT' : 'LACI'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {isLab ? selectedSlot.slotLabel : `Laci Slot ${selectedSlot.slotLabel}`}
                  </h3>
                  <p className="text-xs text-blue-300">
                    Lokasi: {locationName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setShowAddForm(false);
                }}
                className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-red-600 transition-colors flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span>{isLab ? 'Isi Tingkat' : 'Isi Laci'} • {selectedSlotItems.length} Barang</span>
                  {selectedSlotItems.length > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      Total: {selectedSlotItems.reduce((acc, i) => acc + (i.quantity || 0), 0)} pcs
                    </span>
                  )}
                </span>
                <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-bold">
                  Slot ID: {selectedSlot.fullRackKey}
                </span>
              </div>

              {/* Items List in this Slot */}
              {selectedSlotItems.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-600">
                    {isLab ? 'Tingkat rak ini saat ini masih kosong' : 'Laci ini saat ini masih kosong'}
                  </p>
                  {role === 'admin' ? (
                    <p className="text-xs text-slate-400 mt-1">
                      Anda bisa mengisi barang baru ke {isLab ? 'tingkat' : 'laci'}{' '}
                      <span className="font-bold text-blue-600">{selectedSlot.fullRackKey}</span> langsung di bawah.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Belum ada barang yang disimpan di slot ini.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSlotItems.map((item) => {
                    const isORing = item.category.toLowerCase() === 'o-ring';
                    const isCheckedOut = item.status === 'checked_out';
                    const qty = item.quantity || 0;
                    const isAvailable = item.status === 'available' && qty > 0;

                    return editingItem?.id === item.id ? (
                      <form
                        key={item.id}
                        onSubmit={handleSaveEdit}
                        className="p-4 rounded-xl border-2 border-blue-400 bg-blue-50/50 space-y-3 shadow-md animate-fade-in"
                      >
                        <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                          <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                            <span>Edit Barang: <strong className="font-mono text-blue-700">{item.serialNumber}</strong></span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                          >
                            Batal ✕
                          </button>
                        </div>

                        {editError && (
                          <div className="p-2.5 rounded-lg bg-rose-100 text-rose-900 text-xs font-medium border border-rose-200">
                            {editError}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Plat Number *</label>
                            <input
                              type="text"
                              required
                              value={editFormData.serialNumber}
                              onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori *</label>
                            <input
                              type="text"
                              required
                              value={editFormData.category}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Barang *</label>
                          <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Sisa Stok (Pcs) *</label>
                            <input
                              type="number"
                              min={0}
                              required
                              value={editFormData.quantity}
                              onChange={(e) => setEditFormData({ ...editFormData, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Rak / Posisi *</label>
                            <select
                              required
                              value={editFormData.rack}
                              onChange={(e) => setEditFormData({ ...editFormData, rack: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                              {isLab ? (
                                LAB_CABINETS.map((cab) => (
                                  <optgroup key={cab.id} label={cab.name}>
                                    {cab.shelves.map((shelf) => {
                                      const rackVal = `Lemari ${cab.id} - ${shelf.name}`;
                                      return (
                                        <option key={rackVal} value={rackVal}>
                                          {rackVal} {shelf.label ? `(${shelf.label})` : ''}
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                ))
                              ) : (
                                CABINET_CONFIG.rows.map((row) => (
                                  <optgroup key={row} label={`Baris ${row}`}>
                                    {CABINET_CONFIG.cols.map((col) => {
                                      const rName = `Rak - ${row}${col}`;
                                      return (
                                        <option key={rName} value={rName}>
                                          {rName}
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                ))
                              )}
                              {!rackOptions.includes(editFormData.rack) && editFormData.rack && (
                                <option value={editFormData.rack}>{editFormData.rack} (Kustom)</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                            <select
                              value={editFormData.status}
                              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                              <option value="available">Available</option>
                              <option value="checked_out">Checked Out</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1.5 border-t border-blue-200">
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                          >
                            {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-blue-900 text-base">
                                {item.serialNumber}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                {item.category}
                              </span>
                              {/* Badge Sisa Stok */}
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Sisa: <strong className="font-mono text-sm">{qty}</strong> pcs
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium mt-1">{item.name}</p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          {isAvailable ? (
                            role === 'admin' ? (
                              <Link
                                href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=checkout`}
                                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-colors bg-red-500 hover:bg-red-600 text-white shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <span>Ambil Barang</span>
                                <span className="bg-red-700/60 px-2 py-0.5 rounded text-[11px] font-mono">
                                  (Sisa {qty} pcs)
                                </span>
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  setContactAdminItem(item);
                                  setShowContactAdmin(true);
                                }}
                                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-colors bg-red-500 hover:bg-red-600 text-white shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <span>Ambil Barang</span>
                                <span className="bg-red-700/60 px-2 py-0.5 rounded text-[11px] font-mono">
                                  (Sisa {qty} pcs)
                                </span>
                              </button>
                            )
                          ) : isORing ? (
                            <div className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center bg-amber-50 text-amber-800 border border-amber-200">
                              {qty <= 0 ? 'Stok Habis (0 pcs) - Habis Pakai' : 'Habis Pakai (Tidak dapat dikembalikan)'}
                            </div>
                          ) : (
                            role === 'admin' ? (
                              <Link
                                href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=return`}
                                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <span>Kembalikan Barang</span>
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  setContactAdminItem(item);
                                  setShowContactAdmin(true);
                                }}
                                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <span>Kembalikan Barang</span>
                              </button>
                            )
                          )}

                          {role === 'admin' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStartEdit(item)}
                                title="Edit data barang ini"
                                className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
                              >
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.serialNumber)}
                                title="Hapus dari database"
                                className="px-2.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ADMIN DIRECT FILL SECTION (Hanya untuk Admin) */}
              {role === 'admin' && (
                <div className="border-t border-slate-200 pt-4">
                  {!showAddForm ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                    >
                      <span>Isi / Tambah Barang ke {isLab ? selectedSlot.slotLabel : `Laci ${selectedSlot.slotLabel}`}</span>
                    </button>
                  ) : (
                    <div className="border rounded-xl p-4 space-y-3.5 animate-fade-in bg-blue-50/50 border-blue-200">
                      <div className="flex items-center justify-between border-b pb-2 border-blue-200">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-blue-950">
                          <span>Form Isi {selectedSlot.fullRackKey}</span>
                        </span>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                        >
                          Batal ✕
                        </button>
                      </div>

                    {formMsg.text && (
                      <div
                        className={`p-2.5 rounded-lg text-xs font-medium ${
                          formMsg.type === 'success'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {formMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleDirectAddItem} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Plat Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nama Barang *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Jumlah (Qty) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            required
                            value={formData.quantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Kategori *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="flex-1 py-2 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:bg-slate-300 bg-blue-600 hover:bg-blue-700"
                        >
                          {formLoading
                            ? 'Menyimpan...'
                            : `Simpan ${formData.quantity > 1 ? `${formData.quantity} Barang ` : ''}ke Laci Ini`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          Tutup
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Klik luar atau tombol silang untuk menutup</span>
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setShowAddForm(false);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: HUBUNGI ADMIN (for non-admin users) */}
      <ContactAdminModal
        isOpen={showContactAdmin}
        onClose={() => setShowContactAdmin(false)}
        item={contactAdminItem}
      />
    </div>
  );
}
