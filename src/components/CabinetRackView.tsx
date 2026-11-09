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
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  cols: [1, 2, 3, 4],
};

// 3 Lemari di Lokasi Lab dengan 4 Sekat = 5 Tingkat Rak
export interface LabShelf {
  index: number;
  name: string;
  subtitle: string;
}

export interface LabCabinetConfig {
  id: number;
  name: string;
  shortName: string;
  shelves: LabShelf[];
}

const LAB_CABINETS: LabCabinetConfig[] = [
  {
    id: 1,
    name: 'Lemari 1',
    shortName: 'Lemari 1',
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

  const [selectedSlot, setSelectedSlot] = useState<{
    cabinetName: string;
    slotLabel: string;
    fullRackKey: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cabinet' | 'list'>('cabinet');

  // Modal Tambah Barang (Hanya Nama Barang & Quantity)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormRack, setAddFormRack] = useState('');
  const [addFormData, setAddFormData] = useState({
    name: '',
    quantity: 1,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  // Edit item state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    quantity: 1,
    status: 'available',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Contact Admin popup state
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

  // Find slot that matches the search query to highlight it
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

  // Helper to get items in a specific slot (Module Room)
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

  // Open Add Modal targeted to a shelf or generic
  const handleOpenAddModal = (targetRack?: string) => {
    const rackToUse = targetRack || (rackOptions.length > 0 ? rackOptions[0] : 'Lemari 1 - Tingkat 1');
    setAddFormRack(rackToUse);
    setAddFormData({
      name: '',
      quantity: 1,
    });
    setAddMsg({ text: '', type: '' });
    setIsAddModalOpen(true);
  };

  // Submit Add Item (Hanya Nama Barang & Quantity)
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name.trim()) return;

    setAddLoading(true);
    setAddMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addFormData.name.trim(),
          quantity: addFormData.quantity || 1,
          location: locationName,
          rack: addFormRack.trim(),
          status: 'available',
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const addedItems: InventoryItem[] = result.items || [result];
        setAddMsg({
          text: `Berhasil menambahkan "${addFormData.name}" ke ${addFormRack}!`,
          type: 'success',
        });
        setItems((prev) => [...prev, ...addedItems]);
        router.refresh();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddMsg({ text: '', type: '' });
        }, 900);
      } else {
        const err = await res.json();
        setAddMsg({ text: err.error || 'Gagal menambahkan barang', type: 'error' });
      }
    } catch {
      setAddMsg({ text: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setAddLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (serialNumber: string) => {
    if (!confirm(`Hapus barang "${serialNumber}"?`)) return;

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

  // Start edit
  const handleStartEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      quantity: item.quantity ?? 1,
      status: item.status,
    });
    setEditError('');
  };

  // Save edit
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
          name: editFormData.name.trim(),
          quantity: Math.max(0, editFormData.quantity),
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
    <div className="space-y-4">
      {/* Control Bar: Polos & Bersih */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-none">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Barang..."
            className="w-full pl-9 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
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
              className="absolute right-2.5 top-2 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-300"
            >
              Reset
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Button Tambah Barang Utama */}
          <button
            onClick={() => handleOpenAddModal()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Barang</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('cabinet')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'cabinet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lemari
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar
            </button>
          </div>
        </div>
      </div>

      {/* Mode: Visual Cabinet (Polos & Minimalis) */}
      {viewMode === 'cabinet' && (
        <div className="space-y-4">
          {/* Legend Polos */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium text-slate-600">
              Total {items.length} barang di lokasi ini
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Tersedia</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Habis</span>
              </span>
              {highlightedSlot && (
                <span className="flex items-center gap-1.5 text-purple-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                  <span>Hasil Cari</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            {isLab ? (
              /* ======================================================== */
              /* LAB: 3 LEMARI POLOS & BERSIH                             */
              /* ======================================================== */
              <div className="w-full max-w-[1700px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {LAB_CABINETS.map((cabinet) => {
                    const isDoorsOpen = doorsOpenMap[cabinet.id] ?? true;
                    const count = getLabCabinetItemCount(cabinet.id);

                    return (
                      <div
                        key={cabinet.id}
                        className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                      >
                        {/* Header Lemari: Polos, Rapi */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 tracking-wide">
                                {cabinet.name.toUpperCase()}
                              </h3>
                              <p className="text-xs text-slate-500">
                                4 Sekat • 5 Tingkat Rak ({count} item)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAddModal(`Lemari ${cabinet.id} - Tingkat 1`)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center gap-1"
                              title={`Tambah barang ke ${cabinet.name}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Tambah Barang</span>
                            </button>

                            <button
                              onClick={() =>
                                setDoorsOpenMap((prev) => ({
                                  ...prev,
                                  [cabinet.id]: !isDoorsOpen,
                                }))
                              }
                              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              {isDoorsOpen ? 'Tutup Pintu' : 'Buka Pintu'}
                            </button>
                          </div>
                        </div>

                        {/* Lemari Body */}
                        {!isDoorsOpen ? (
                          /* Pintu Tertutup Polos */
                          <div
                            onClick={() =>
                              setDoorsOpenMap((prev) => ({
                                ...prev,
                                [cabinet.id]: true,
                              }))
                            }
                            className="h-80 bg-slate-50 border-t border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-semibold text-slate-600">
                              {cabinet.name} Tertutup
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              Klik untuk membuka rak
                            </span>
                          </div>
                        ) : (
                          /* Pintu Terbuka: 5 Tingkat Rak Polos */
                          <div className="p-3 space-y-3 bg-white">
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
                              const shelfKey = `Lemari ${cabinet.id} - ${shelf.name}`;
                              const isSelected = selectedSlot?.fullRackKey === shelfKey;

                              const isHighlighted =
                                highlightedSlot &&
                                (highlightedSlot.toLowerCase().includes(`lemari ${cabinet.id}`) ||
                                  highlightedSlot.toLowerCase().includes(`l${cabinet.id}`)) &&
                                (highlightedSlot.toLowerCase().includes(shelf.name.toLowerCase()) ||
                                  highlightedSlot.toLowerCase().includes(`t${shelf.index}`));

                              return (
                                <div key={shelf.name} className="space-y-1">
                                  {/* Rak Card Polos */}
                                  <div
                                    className={`rounded-md border transition-all ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-300'
                                        : isHighlighted
                                        ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-300 animate-pulse'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    {/* Tingkat Header */}
                                    <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">
                                          {shelf.name.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-slate-600 font-medium truncate">
                                          {shelf.subtitle}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Status Badge */}
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                            hasItems
                                              ? isAvailable
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                                          }`}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              hasItems
                                                ? isAvailable
                                                  ? 'bg-emerald-500'
                                                  : 'bg-rose-500'
                                                : 'bg-slate-400'
                                            }`}
                                          />
                                          {hasItems ? (isAvailable ? 'Tersedia' : 'Habis') : 'Kosong'}
                                        </span>

                                        {/* BUTTON TAMBAH BARANG DI SETIAP TINGKAT */}
                                        <button
                                          onClick={() => handleOpenAddModal(shelfKey)}
                                          className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 text-xs font-semibold rounded border border-blue-200 transition-colors flex items-center gap-1"
                                          title={`Tambah barang ke ${shelf.name}`}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                          <span>Tambah</span>
                                        </button>

                                        {/* Buka Tingkat Button */}
                                        <button
                                          onClick={() => {
                                            setSelectedSlot({
                                              cabinetName: cabinet.name.toUpperCase(),
                                              slotLabel: shelf.name,
                                              fullRackKey: shelfKey,
                                            });
                                          }}
                                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                        >
                                          <span>Buka</span>
                                          <span>→</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Tingkat Items (Tampilan Polos) */}
                                    <div
                                      onClick={() => {
                                        setSelectedSlot({
                                          cabinetName: cabinet.name.toUpperCase(),
                                          slotLabel: shelf.name,
                                          fullRackKey: shelfKey,
                                        });
                                      }}
                                      className="p-2.5 cursor-pointer hover:bg-slate-50/50 transition-colors min-h-[52px]"
                                    >
                                      {shelfItems.length > 0 ? (
                                        <div className="space-y-1.5">
                                          {shelfItems.map((item) => (
                                            <div
                                              key={item.id || item.serialNumber}
                                              className="flex items-center justify-between p-2 rounded border border-slate-200/80 bg-white hover:border-slate-300 transition-all text-xs"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                  </svg>
                                                </div>
                                                <div className="min-w-0">
                                                  <div className="font-semibold text-slate-900 truncate">
                                                    {item.name}
                                                  </div>
                                                </div>
                                              </div>
                                              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                                                {item.quantity ?? 1} pcs
                                              </span>
                                            </div>
                                          ))}
                                          <div className="text-right text-[11px] text-blue-600 font-semibold pt-0.5">
                                            Total {totalQty} pcs
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between py-2 px-2 text-slate-400 text-xs">
                                          <span>Kosong (belum ada barang)</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenAddModal(shelfKey);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-[11px]"
                                          >
                                            + Isi sekarang
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sekat Divider: Polos */}
                                  {shelfIdx < 4 && (
                                    <div className="py-1 flex items-center gap-2 select-none">
                                      <div className="h-px bg-slate-200 flex-1"></div>
                                      <span className="text-[10px] font-mono text-slate-400 font-medium uppercase tracking-wider">
                                        Sekat {shelfIdx + 1}
                                      </span>
                                      <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* MODULE ROOM: 32 LACI POLOS                               */
              /* ======================================================== */
              <div className="w-full max-w-2xl bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="font-bold text-sm text-slate-800">
                    Lemari Rak (4 Kolom x 8 Baris = 32 Laci)
                  </div>
                  <button
                    onClick={() => handleOpenAddModal('Rak - A1')}
                    className="px-2.5 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 font-semibold flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Tambah Barang</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {CABINET_CONFIG.rows.map((row) =>
                    CABINET_CONFIG.cols.map((col) => {
                      const slotCode = `${row}${col}`;
                      const slotItems = getItemsInSlot(slotCode);
                      const hasItems = slotItems.length > 0;
                      const isAvailable = slotItems.some((i) => i.status === 'available');

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
                              cabinetName: CABINET_CONFIG.name,
                              slotLabel: slotCode,
                              fullRackKey: `Rak - ${slotCode}`,
                            });
                          }}
                          className={`relative h-14 rounded border p-2 flex flex-col justify-between text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-300'
                              : isHighlighted
                              ? 'border-purple-500 bg-purple-50 animate-pulse ring-1 ring-purple-300'
                              : hasItems
                              ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {slotCode}
                            </span>
                            {hasItems && (
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {hasItems ? `${slotItems.length} item` : 'Kosong'}
                          </div>
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

      {/* Mode: List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const isORing = item.category.toLowerCase() === 'o-ring';
              const isCheckedOut = item.status === 'checked_out';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${
                        item.quantity > 0 && item.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.quantity || 0} pcs
                      </span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {item.rack}
                    </span>

                    {isCheckedOut && isORing ? (
                      <span className="text-amber-600 font-medium">Habis Pakai</span>
                    ) : (
                      <Link
                        href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=${
                          item.status === 'available' ? 'checkout' : 'return'
                        }`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {item.status === 'available' ? 'Ambil' : 'Kembalikan'} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH BARANG (HANYA NAMA BARANG & QUANTITY)       */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>Form Isi {addFormRack}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5 font-medium"
              >
                <span>Batal</span>
                <span>✕</span>
              </button>
            </div>

            {/* Modal Form: HANYA NAMA BARANG & QUANTITY */}
            <form onSubmit={handleAddItemSubmit} className="p-5 space-y-4">
              {addMsg.text && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium border ${
                    addMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {addMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama barang..."
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jumlah (Qty) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={addFormData.quantity}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {addLoading ? 'Menyimpan...' : 'Simpan ke Laci Ini'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL SLOT SAAT TINGKAT/LACI DIKLIK               */}
      {/* ======================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedSlot.fullRackKey}
                </h3>
                <p className="text-xs text-slate-500">
                  Lokasi: {locationName} • {selectedSlotItems.length} item tersimpan
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="w-7 h-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Daftar Barang ({selectedSlotItems.length})
                </span>
                <button
                  onClick={() => handleOpenAddModal(selectedSlot.fullRackKey)}
                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah Barang ke Sini</span>
                </button>
              </div>

              {selectedSlotItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  <p className="text-xs font-medium">Slot ini saat ini masih kosong</p>
                  <button
                    onClick={() => handleOpenAddModal(selectedSlot.fullRackKey)}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Klik untuk Tambah Barang
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSlotItems.map((item) => {
                    const isORing = item.category.toLowerCase() === 'o-ring';
                    const qty = item.quantity || 0;
                    const isAvailable = item.status === 'available' && qty > 0;

                    return editingItem?.id === item.id ? (
                      <form
                        key={item.id}
                        onSubmit={handleSaveEdit}
                        className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Edit Barang
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            Batal ✕
                          </button>
                        </div>

                        {editError && (
                          <div className="p-2 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
                            {editError}
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nama Barang *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Nama Barang"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Jumlah (Qty) *
                            </label>
                            <input
                              type="number"
                              min={0}
                              required
                              value={editFormData.quantity}
                              onChange={(e) => setEditFormData({ ...editFormData, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Status
                            </label>
                            <select
                              value={editFormData.status}
                              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                            >
                              <option value="available">Available</option>
                              <option value="checked_out">Checked Out</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                          >
                            {editLoading ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-slate-900">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                  isAvailable
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                Sisa: {qty} pcs
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          {isAvailable ? (
                            <Link
                              href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=checkout`}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-medium transition-colors"
                            >
                              Ambil Barang
                            </Link>
                          ) : isORing ? (
                            <span className="text-slate-400 font-medium">Habis Pakai</span>
                          ) : (
                            <Link
                              href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=return`}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-medium transition-colors"
                            >
                              Kembalikan
                            </Link>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.serialNumber)}
                              className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenAddModal(selectedSlot.fullRackKey)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>+ Tambah barang ke {selectedSlot.slotLabel}</span>
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: HUBUNGI ADMIN */}
      <ContactAdminModal
        isOpen={showContactAdmin}
        onClose={() => setShowContactAdmin(false)}
        item={contactAdminItem}
      />
    </div>
  );
}
