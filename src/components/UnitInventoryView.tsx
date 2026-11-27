'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';

export interface UnitItem {
  id: string;
  unitId: string;
  serialNumber: string;
  name: string;
  category?: string;
  quantity?: number;
  status?: string;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Unit {
  id: string;
  name: string;
  plateNumber?: string | null;
  status?: string;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  items?: UnitItem[];
}

interface UnitInventoryViewProps {
  initialUnits: Unit[];
  userRole?: string | null;
}

export default function UnitInventoryView({
  initialUnits,
  userRole,
}: UnitInventoryViewProps) {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [role, setRole] = useState<string | null>(userRole || null);

  // Active unit tab selection
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialUnits.length > 0 ? initialUnits[0].id : ''
  );

  // View mode: 'focus' (full width table, very spacious & comfortable) or 'grid' (side by side cards)
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add input state for the active unit
  const [itemNameInput, setItemNameInput] = useState('');
  const [itemSerialInput, setItemSerialInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state: { itemId: string, name: string, serialNumber: string } | null
  const [inlineEditing, setInlineEditing] = useState<{
    itemId: string;
    name: string;
    serialNumber: string;
  } | null>(null);

  // Unit modal (Tambah / Edit Unit)
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Bulk Paste from Excel modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Notifications
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!role) {
      const cookies = document.cookie.split(';');
      const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
      if (roleCookie) setRole(roleCookie.split('=')[1]);
    }
  }, [role]);

  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 3500);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  // Current active unit
  const currentUnit = useMemo(() => {
    return units.find((u) => u.id === selectedUnitId) || units[0] || null;
  }, [units, selectedUnitId]);

  // If selectedUnitId is not set, set it to first unit
  useEffect(() => {
    if ((!selectedUnitId || !units.some((u) => u.id === selectedUnitId)) && units.length > 0) {
      setSelectedUnitId(units[0].id);
    }
  }, [units, selectedUnitId]);

  // Refresh units from backend
  const refreshUnits = async (selectId?: string) => {
    try {
      const res = await fetch('/api/units', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUnits(data);
          if (selectId) setSelectedUnitId(selectId);
        }
      }
    } catch {
      // ignore
    }
  };

  // Add Item to current unit
  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUnit) return;

    const name = itemNameInput.trim();
    const serialNumber = itemSerialInput.trim();

    if (!name) {
      setAlertMsg({ text: 'Nama Barang wajib diisi', type: 'error' });
      nameInputRef.current?.focus();
      return;
    }
    if (!serialNumber) {
      setAlertMsg({ text: 'Serial Number wajib diisi', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${currentUnit.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          serialNumber,
          category: 'Module',
          quantity: 1,
          status: 'available',
          person: role || 'Petugas',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menambahkan barang');
      }

      // Reset input, keep item name if user wants to enter multiple of the same tool, or clear
      setItemSerialInput('');
      setAlertMsg({ text: `✓ Berhasil ditambahkan: "${name}" (${serialNumber})`, type: 'success' });
      nameInputRef.current?.focus();
      await refreshUnits(currentUnit.id);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menyimpan barang', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Save Inline Edit
  const handleSaveInlineEdit = async () => {
    if (!inlineEditing || !currentUnit) return;
    const { itemId, name, serialNumber } = inlineEditing;

    if (!name.trim() || !serialNumber.trim()) {
      setAlertMsg({ text: 'Nama Barang dan Serial Number tidak boleh kosong', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${currentUnit.id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          serialNumber: serialNumber.trim(),
        }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui data');
      setAlertMsg({ text: 'Data barang berhasil diperbarui', type: 'success' });
      setInlineEditing(null);
      await refreshUnits(currentUnit.id);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal memperbarui', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (unitId: string, itemId: string, itemName: string) => {
    if (!confirm(`Hapus barang "${itemName}" dari mobil ini?`)) return;

    try {
      const res = await fetch(`/api/units/${unitId}/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      setAlertMsg({ text: `Barang "${itemName}" berhasil dihapus`, type: 'info' });
      await refreshUnits(unitId);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menghapus', type: 'error' });
    }
  };

  // Bulk Import parsed from Excel paste
  const parsedBulkRows = useMemo(() => {
    if (!bulkText.trim()) return [];
    const lines = bulkText.split('\n');
    const result: { name: string; serialNumber: string }[] = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Handle tab-separated (standard Excel copy) or comma or multiple spaces
      let parts: string[] = [];
      if (cleanLine.includes('\t')) {
        parts = cleanLine.split('\t');
      } else if (cleanLine.includes(',')) {
        parts = cleanLine.split(',');
      } else if (cleanLine.includes(';')) {
        parts = cleanLine.split(';');
      } else {
        // split by 2 or more spaces
        parts = cleanLine.split(/\s{2,}/);
      }

      if (parts.length >= 2) {
        const name = parts[0].trim();
        const serialNumber = parts[1].trim();
        // Ignore header line if copied accidentally
        if (
          name.toLowerCase() === 'nama barang' ||
          name.toLowerCase() === 'nama' ||
          serialNumber.toLowerCase() === 'serial number'
        ) {
          return;
        }
        if (name && serialNumber) {
          result.push({ name, serialNumber });
        }
      }
    });

    return result;
  }, [bulkText]);

  // Execute Bulk Import
  const handleExecuteBulkImport = async () => {
    if (!currentUnit || parsedBulkRows.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/units/${currentUnit.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: parsedBulkRows,
          person: role || 'Petugas',
        }),
      });

      if (!res.ok) throw new Error('Gagal mengimpor barang');
      const data = await res.json();
      setAlertMsg({
        text: `✓ Berhasil mengimpor ${data.count || parsedBulkRows.length} barang ke ${currentUnit.name}!`,
        type: 'success',
      });
      setBulkModalOpen(false);
      setBulkText('');
      await refreshUnits(currentUnit.id);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal mengimpor barang', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Save Unit (Create or Update)
  const handleSaveUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get('name')?.toString().trim() || '';
    const plateNumber = formData.get('plateNumber')?.toString().trim() || '';

    if (!name) {
      setAlertMsg({ text: 'Nama unit wajib diisi', type: 'error' });
      setSubmitting(false);
      return;
    }

    try {
      if (editingUnit) {
        const res = await fetch(`/api/units/${editingUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, plateNumber }),
        });
        if (!res.ok) throw new Error('Gagal mengubah nama unit');
        setAlertMsg({ text: `Unit "${name}" berhasil diperbarui`, type: 'success' });
        await refreshUnits(editingUnit.id);
      } else {
        const res = await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, plateNumber }),
        });
        if (!res.ok) throw new Error('Gagal membuat unit');
        const created = await res.json();
        setAlertMsg({ text: `Unit "${name}" berhasil dibuat`, type: 'success' });
        await refreshUnits(created.id);
      }

      setUnitModalOpen(false);
      setEditingUnit(null);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menyimpan unit', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Unit
  const handleDeleteUnit = async (unit: Unit) => {
    if (!confirm(`Hapus unit "${unit.name}" beserta semua data barang di dalamnya?`)) return;

    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus unit');
      setAlertMsg({ text: `Unit "${unit.name}" berhasil dihapus`, type: 'info' });
      await refreshUnits();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menghapus unit', type: 'error' });
    }
  };

  // Export current unit or all units to CSV
  const exportCSV = () => {
    if (!currentUnit || (currentUnit.items || []).length === 0) {
      setAlertMsg({ text: 'Tidak ada data untuk diexport', type: 'info' });
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += `"${currentUnit.name}"\n`;
    csvContent += 'Nama Barang,Serial Number\n';
    (currentUnit.items || []).forEach((item) => {
      csvContent += `"${(item.name || '').replace(/"/g, '""')}","${(item.serialNumber || '').replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventori_${currentUnit.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active items for current focused unit filtered by search query
  const filteredActiveItems = useMemo(() => {
    if (!currentUnit) return [];
    const items = currentUnit.items || [];
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.serialNumber || '').toLowerCase().includes(q)
    );
  }, [currentUnit, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Toast Alert */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all animate-fade-in ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
              : alertMsg.type === 'error'
              ? 'bg-red-50 text-red-950 border-red-300 dark:bg-red-950/90 dark:text-red-200 dark:border-red-700'
              : 'bg-blue-50 text-blue-950 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-lg">
              {alertMsg.type === 'success' ? '✓' : alertMsg.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <p className="font-semibold text-sm">{alertMsg.text}</p>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-xs font-bold px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Link href="/" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-500">Inventori Unit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white tracking-tight flex items-center gap-3">
            <span>Inventori Mobil / Unit</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Kelola daftar barang dan nomor seri setiap mobil dengan cepat dan praktis.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* View mode toggle */}
          <div className="inline-flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewMode('focus')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'focus'
                  ? 'bg-white dark:bg-blue-700 text-blue-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Mode Tabel Penuh</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-blue-700 text-blue-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Semua Mobil</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingUnit(null);
              setUnitModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Unit Mobil Baru</span>
          </button>
        </div>
      </div>

      {/* Modern Unit Tabs Bar (Top Navigation) */}
      <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-slate-300 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 shrink-0">
            Pilih Mobil:
          </span>

          {units.map((unit) => {
            const isSelected = unit.id === selectedUnitId;
            const count = unit.items?.length || 0;
            return (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-blue-500/30 scale-[1.02]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🚗 {unit.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setEditingUnit(null);
              setUnitModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-dashed border-blue-400 dark:border-blue-700 flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            + Tambah Mobil
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: FOCUS MODE (Spacious, Clean Full-Width Table - Very Comfortable!) */}
      {/* ========================================================================= */}
      {viewMode === 'focus' && currentUnit && (
        <div className="space-y-4">
          {/* Focused Unit Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xl">
                  🚗
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentUnit.name}
                    </h2>
                    {currentUnit.plateNumber && (
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700">
                        {currentUnit.plateNumber}
                      </span>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-3 py-1 rounded-full font-bold">
                      {currentUnit.items?.length || 0} Barang Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Isi dan kelola muatan pada unit ini di bawah.
                  </p>
                </div>
              </div>

              {/* Action buttons for this unit */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  onClick={() => {
                    setBulkText('');
                    setBulkModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  title="Copy-paste langsung banyak baris dari Excel"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>📋 Tempel dari Excel</span>
                </button>

                <button
                  onClick={exportCSV}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-all"
                  title="Download file CSV Excel"
                >
                  Export CSV
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Print
                </button>

                <button
                  onClick={() => {
                    setEditingUnit(currentUnit);
                    setUnitModalOpen(true);
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-all"
                  title="Ubah Nama Mobil"
                >
                  Edit Mobil
                </button>

                <button
                  onClick={() => handleDeleteUnit(currentUnit)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all"
                  title="Hapus Mobil Ini"
                >
                  Hapus Mobil
                </button>
              </div>
            </div>

            {/* Search within this unit */}
            <div className="pt-3 flex items-center justify-between gap-3 print:hidden">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari barang di ${currentUnit.name}...`}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Menampilkan: <strong className="text-slate-800 dark:text-slate-200">{filteredActiveItems.length}</strong> barang
              </span>
            </div>
          </div>

          {/* Spacious Table for Active Unit */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                    <th className="py-3.5 px-4 w-14 text-center border-r border-slate-200 dark:border-slate-700">
                      No
                    </th>
                    <th className="py-3.5 px-6 border-r border-slate-200 dark:border-slate-700">
                      Nama Barang
                    </th>
                    <th className="py-3.5 px-6 border-r border-slate-200 dark:border-slate-700">
                      Serial Number
                    </th>
                    <th className="py-3.5 px-4 w-32 text-center print:hidden">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredActiveItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-3">
                          <p className="font-bold text-base text-slate-600 dark:text-slate-300">
                            Belum ada barang di {currentUnit.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Tambahkan barang dengan mengisi formulir di bawah ini, atau gunakan tombol &quot;Tempel dari Excel&quot; untuk mengimpor banyak sekaligus.
                          </p>
                          <button
                            onClick={() => {
                              setBulkText('');
                              setBulkModalOpen(true);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            📋 Tempel Baris dari Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredActiveItems.map((item, idx) => {
                      const isEditing = inlineEditing?.itemId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* No */}
                          <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                            {idx + 1}
                          </td>

                          {/* Nama Barang */}
                          <td className="py-3 px-6 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                            {isEditing ? (
                              <input
                                type="text"
                                value={inlineEditing.name}
                                onChange={(e) =>
                                  setInlineEditing({ ...inlineEditing, name: e.target.value })
                                }
                                className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border-2 border-blue-500 focus:outline-none dark:text-white font-bold"
                              />
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </td>

                          {/* Serial Number */}
                          <td className="py-3 px-6 border-r border-slate-200 dark:border-slate-800">
                            {isEditing ? (
                              <input
                                type="text"
                                value={inlineEditing.serialNumber}
                                onChange={(e) =>
                                  setInlineEditing({ ...inlineEditing, serialNumber: e.target.value })
                                }
                                className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border-2 border-blue-500 font-mono focus:outline-none dark:text-white font-bold"
                              />
                            ) : (
                              <span className="font-mono font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 inline-block text-xs">
                                {item.serialNumber}
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center print:hidden">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={handleSaveInlineEdit}
                                  disabled={submitting}
                                  className="px-2.5 py-1 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm"
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setInlineEditing(null)}
                                  className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() =>
                                    setInlineEditing({
                                      itemId: item.id,
                                      name: item.name,
                                      serialNumber: item.serialNumber,
                                    })
                                  }
                                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(currentUnit.id, item.id, item.name)}
                                  className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 rounded-lg transition-colors border border-red-200 dark:border-red-900"
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Comfortable Inline Add Form (Directly below table) */}
            <form
              onSubmit={handleAddItem}
              className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 print:hidden"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Nama Barang
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="misal: MCMP-T"
                    value={itemNameInput}
                    onChange={(e) => setItemNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                  />
                </div>

                <div className="sm:w-56">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 4444"
                    value={itemSerialInput}
                    onChange={(e) => setItemSerialInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                  />
                </div>

                <div className="sm:self-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>+ Tambah Baris</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Tip: Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Enter</kbd> untuk langsung menambahkan dan mengisi baris berikutnya.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GRID VIEW (Side-by-Side Cards for All Units - Redesigned & Roomy) */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {units.map((unit) => {
            const items = unit.items || [];
            return (
              <div
                key={unit.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Unit Header */}
                <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg">🚗</span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                      {unit.name}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                      {items.length} item
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 print:hidden">
                    <button
                      onClick={() => {
                        setSelectedUnitId(unit.id);
                        setViewMode('focus');
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      Buka Penuh ↗
                    </button>
                    <button
                      onClick={() => {
                        setEditingUnit(unit);
                        setUnitModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                      title="Edit Nama Unit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(unit)}
                      className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                      title="Hapus Unit"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold sticky top-0">
                        <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-1/2">
                          Nama Barang
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-1/3">
                          Serial Number
                        </th>
                        <th className="py-2.5 px-2 text-center w-12 print:hidden">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-400 italic text-xs">
                            Belum ada barang di mobil ini.
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {item.serialNumber}
                            </td>
                            <td className="py-1 px-2 text-center print:hidden">
                              <button
                                onClick={() => handleDeleteItem(unit.id, item.id, item.name)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Hapus Baris"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Quick Add at bottom */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
                  <span className="text-xs text-slate-500">
                    Ingin tambah atau edit data mobil ini?
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUnitId(unit.id);
                      setViewMode('focus');
                    }}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    + Kelola di Tabel Penuh
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PASTE DARI EXCEL (Sangat Mudah & Cepat!) */}
      {/* ========================================================================= */}
      {bulkModalOpen && currentUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📋</span>
                <h3 className="font-bold text-base">
                  Tempel Data dari Excel ke {currentUnit.name}
                </h3>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <p className="font-bold mb-1">Cara Mudah:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Buka file Excel Anda.</li>
                  <li>Sorot/Blok kolom <strong>Nama Barang</strong> dan <strong>Serial Number</strong> lalu tekan <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Ctrl + C</kbd>.</li>
                  <li>Tempel / Paste (<kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Ctrl + V</kbd>) ke kotak di bawah ini.</li>
                </ol>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Kotak Tempel (Paste) Excel:
                </label>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`MCMP-T\t4444\nMCMP-T\t4444\nMCMP-T\t4444`}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Preview Rows */}
              {parsedBulkRows.length > 0 && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-2">
                    ✓ Terdeteksi {parsedBulkRows.length} baris siap diimpor:
                  </span>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 text-[11px]">
                    {parsedBulkRows.slice(0, 10).map((row, i) => (
                      <div key={i} className="py-1 flex justify-between font-mono">
                        <span className="font-bold">{row.name}</span>
                        <span className="text-slate-500">{row.serialNumber}</span>
                      </div>
                    ))}
                    {parsedBulkRows.length > 10 && (
                      <div className="pt-1 text-slate-400 italic">
                        ...dan {parsedBulkRows.length - 10} baris lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkImport}
                disabled={submitting || parsedBulkRows.length === 0}
                className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs transition-all disabled:opacity-50"
              >
                {submitting ? 'Mengimpor...' : `Impor ${parsedBulkRows.length} Barang Sekarang`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT MOBIL */}
      {/* ========================================================================= */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-blue-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUnit ? `Ubah Nama Unit: ${editingUnit.name}` : 'Tambah Unit Mobil Baru'}
              </h3>
              <button
                onClick={() => setUnitModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Unit Mobil *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingUnit?.name || ''}
                  placeholder="e.g. UNIT 9717 / UNIT 5852"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white uppercase font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Plat Nomor / Keterangan (Opsional)
                </label>
                <input
                  name="plateNumber"
                  type="text"
                  defaultValue={editingUnit?.plateNumber || ''}
                  placeholder="e.g. B 9717 SLB"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : editingUnit ? 'Simpan' : 'Buat Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
