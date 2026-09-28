'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import { QRCodeSVG } from 'qrcode.react';

export interface InventoryItem {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  location: string;
  rack: string;
  status: string;
}

interface CabinetRackViewProps {
  locationName: string;
  locationSlug: string;
  items: InventoryItem[];
}

// 4 Columns x 8 Rows = 32 Laci
const CABINET_CONFIG = {
  id: 'cab-1',
  name: 'LEMARI RAK',
  rackPrefix: 'Rak',
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], // 8 Baris: A, B, C, D, E, F, G, H
  cols: [1, 2, 3, 4],                             // 4 Kolom: 1, 2, 3, 4
};

export default function CabinetRackView({
  locationName,
  locationSlug,
  items: initialItems,
}: CabinetRackViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [role, setRole] = useState<string | null>(null);
  const [cabinetTheme, setCabinetTheme] = useState<'wood' | 'metal'>('metal');

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
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);

  // Admin inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    category: 'O-Ring',
    status: 'available',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

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

  // Helper to get items in a specific slot (matches A1, Rak - A1, Rak 1 - A1, etc.)
  const getItemsInSlot = (slotCode: string) => {
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
    return getItemsInSlot(selectedSlot.slotLabel);
  }, [selectedSlot, slotItemsMap]);

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
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setFormMsg({ text: 'Barang berhasil ditambahkan ke laci ini', type: 'success' });
        setFormData({
          serialNumber: '',
          name: '',
          category: 'O-Ring',
          status: 'available',
        });
        setItems((prev) => [...prev, newItem]);
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
    if (!confirm(`Hapus barang dengan Serial Number "${serialNumber}" dari slot ini?`)) return;

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
            placeholder="Cari Serial Number atau Nama Barang (misal: BO11870)..."
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

        {/* Theme & View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cabinet Theme Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setCabinetTheme('wood')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                cabinetTheme === 'wood'
                  ? 'bg-amber-800 text-amber-50 shadow-sm'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              Kayu
            </button>
            <button
              onClick={() => setCabinetTheme('metal')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                cabinetTheme === 'metal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Metal
            </button>
          </div>

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

          {/* Centered Single Focused 4x6 Cabinet Shell */}
          <div className="flex justify-center">
            <div
              className={`w-full max-w-xl rounded-3xl p-5 sm:p-7 border-4 shadow-2xl transition-all ${
                cabinetTheme === 'wood'
                  ? 'bg-gradient-to-b from-amber-900 via-amber-950 to-stone-950 border-amber-800 text-amber-100 shadow-amber-950/40'
                  : 'bg-gradient-to-b from-slate-900 via-zinc-900 to-black border-slate-700 text-white shadow-black/80'
              }`}
            >
              {/* 4 Columns x 6 Rows Matrix Container */}
              <div
                className={`grid grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-2xl border-2 ${
                  cabinetTheme === 'wood'
                    ? 'bg-amber-950/90 border-amber-900/90 shadow-inner'
                    : 'bg-zinc-900/70 border-slate-800/80 shadow-inner'
                }`}
              >
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
                            ? cabinetTheme === 'wood'
                              ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-300 scale-105 z-10 font-black shadow-xl border-white'
                              : 'bg-blue-500 text-white ring-4 ring-blue-300 scale-105 z-10 font-black shadow-xl border-white'
                            : isHighlighted
                            ? 'bg-purple-600 text-white ring-4 ring-purple-400 animate-pulse scale-105 z-10 shadow-lg shadow-purple-500/50 border-purple-300'
                            : cabinetTheme === 'wood'
                            ? hasItems
                              ? 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-50 border-amber-500/70 shadow-md hover:scale-[1.03]'
                              : 'bg-gradient-to-b from-amber-900/80 to-amber-950 text-amber-300/80 hover:text-amber-100 border-amber-900/80 hover:bg-amber-800/60'
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
                              ? cabinetTheme === 'wood'
                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                : 'bg-blue-100 text-blue-950 border border-blue-300'
                              : 'bg-black/40 text-slate-300 border border-white/10'
                          }`}
                        >
                          {slotCode}
                        </div>

                        {/* Center Knob */}
                        <div className="flex items-center justify-center my-auto">
                          <div
                            className={`w-4 h-4 rounded-full shadow-md flex items-center justify-center border ${
                              cabinetTheme === 'wood'
                                ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-yellow-200 shadow-black/50'
                                : 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-white shadow-black/50'
                            }`}
                          >
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
                    <h3 className="text-lg font-semibold text-blue-900">{item.serialNumber}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.name}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {item.rack}
                  </span>

                  {/* Viewer tidak memiliki tombol aksi, hanya melihat */}
                  {role !== 'viewer' && (
                    <>
                      {isCheckedOut && isORing ? (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                          Habis Pakai
                        </span>
                      ) : (
                        <Link
                          href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=${
                            item.status === 'available' ? 'checkout' : 'return'
                          }`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          {item.status === 'available' ? 'Ambil' : 'Kembalikan'} →
                        </Link>
                      )}
                    </>
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
            <div
              className={`text-white p-5 flex items-center justify-between ${
                cabinetTheme === 'wood'
                  ? 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950'
                  : 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-950'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-mono font-black shadow-inner ${
                    cabinetTheme === 'wood'
                      ? 'bg-amber-700/80 border-amber-400/40 text-amber-200'
                      : 'bg-blue-700/80 border-blue-400/40 text-blue-100'
                  }`}
                >
                  <span className="text-base">{selectedSlot.slotLabel}</span>
                  <span className="text-[9px]">LACI</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    Laci Slot [{selectedSlot.slotLabel}]
                  </h3>
                  <p className={`text-xs ${cabinetTheme === 'wood' ? 'text-amber-300' : 'text-blue-300'}`}>
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
                <span className="text-sm font-semibold text-slate-700">
                  Isi Laci ({selectedSlotItems.length} Barang)
                </span>
                <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-bold">
                  Slot ID: {selectedSlot.fullRackKey}
                </span>
              </div>

              {/* Items List in this Slot */}
              {selectedSlotItems.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-600">Laci ini saat ini masih kosong</p>
                  {role === 'admin' ? (
                    <p className="text-xs text-slate-400 mt-1">
                      Anda bisa mengisi barang baru ke laci <span className="font-bold text-blue-600">{selectedSlot.fullRackKey}</span> langsung di bawah.
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

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-blue-900 text-base">
                                {item.serialNumber}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium mt-1">{item.name}</p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        {/* Action buttons (Viewer hanya bisa melihat dan melihat QR) */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          {role !== 'viewer' && (
                            <>
                              {item.status === 'available' ? (
                                <Link
                                  href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=checkout`}
                                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-colors bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Ambil Barang
                                </Link>
                              ) : isORing ? (
                                <div className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center bg-amber-50 text-amber-800 border border-amber-200">
                                  Habis Pakai (Tidak dapat dikembalikan)
                                </div>
                              ) : (
                                <Link
                                  href={`/scan/${locationSlug}?serial=${item.serialNumber}&action=return`}
                                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-colors bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Kembalikan Barang
                                </Link>
                              )}
                            </>
                          )}

                          {role === 'viewer' && isCheckedOut && isORing && (
                            <div className="flex-1 text-xs text-slate-500 italic">
                              Habis Pakai
                            </div>
                          )}

                          <button
                            onClick={() => setQrItem(item)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>QR</span>
                          </button>

                          {role === 'admin' && (
                            <button
                              onClick={() => handleDeleteItem(item.serialNumber)}
                              title="Hapus dari database"
                              className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Hapus
                            </button>
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
                      className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                        cabinetTheme === 'wood'
                          ? 'bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950'
                          : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                      }`}
                    >
                      <span>Isi / Tambah Barang ke Laci [{selectedSlot.slotLabel}]</span>
                    </button>
                  ) : (
                    <div
                      className={`border rounded-xl p-4 space-y-3.5 animate-fade-in ${
                        cabinetTheme === 'wood'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-blue-50/50 border-blue-200'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between border-b pb-2 ${
                          cabinetTheme === 'wood' ? 'border-amber-200' : 'border-blue-200'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold flex items-center gap-1.5 ${
                            cabinetTheme === 'wood' ? 'text-amber-950' : 'text-blue-950'
                          }`}
                        >
                          <span>Form Isi Laci [{selectedSlot.fullRackKey}]</span>
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
                          Serial Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder="Contoh: BO11888"
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
                          placeholder="Contoh: O-Ring 55mm Silicone"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Kategori
                          </label>
                          <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Status Awal
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="available">Available</option>
                            <option value="checked_out">Checked Out (None)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className={`flex-1 py-2 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:bg-slate-300 ${
                            cabinetTheme === 'wood'
                              ? 'bg-amber-700 hover:bg-amber-800'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {formLoading ? 'Menyimpan...' : 'Simpan ke Laci Ini'}
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

      {/* QR Item Preview Modal */}
      {qrItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border">
            <h3 className="font-bold text-blue-900 text-lg">QR Code Barang</h3>
            <div className="font-mono text-sm text-slate-600 bg-slate-100 py-1 px-3 rounded-md">
              {qrItem.serialNumber} - {qrItem.name}
            </div>
            <div className="p-3 bg-white border-2 border-blue-200 rounded-xl inline-block">
              <QRCodeSVG
                value={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/scan/${locationSlug}?serial=${
                        qrItem.serialNumber
                      }&action=${qrItem.status === 'available' ? 'checkout' : 'return'}`
                    : ''
                }
                size={180}
                level="H"
              />
            </div>
            <button
              onClick={() => setQrItem(null)}
              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Tutup QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
