'use client';

import { useState, useMemo, useEffect } from 'react';
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

  // Search filter across all units
  const [searchQuery, setSearchQuery] = useState('');

  // Per-unit inline quick-add input states { [unitId]: { name: string, serialNumber: string } }
  const [quickAdd, setQuickAdd] = useState<{ [unitId: string]: { name: string; serialNumber: string } }>({});

  // Unit modal (Tambah / Edit Unit)
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Item edit modal / inline edit state
  const [editingItem, setEditingItem] = useState<{ unitId: string; item: UnitItem } | null>(null);

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

  // Refresh units from backend
  const refreshUnits = async () => {
    try {
      const res = await fetch('/api/units', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setUnits(data);
      }
    } catch {
      // ignore
    }
  };

  // Handle Quick Add Item directly under a Unit Table (like adding a row in Excel)
  const handleQuickAddItem = async (unitId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const current = quickAdd[unitId] || { name: '', serialNumber: '' };
    const name = current.name.trim();
    const serialNumber = current.serialNumber.trim();

    if (!name) {
      setAlertMsg({ text: 'Nama Barang wajib diisi', type: 'error' });
      return;
    }
    if (!serialNumber) {
      setAlertMsg({ text: 'Serial Number wajib diisi', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${unitId}/items`, {
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

      // Reset quick add for this unit (leave name or clear for fast repeat)
      setQuickAdd((prev) => ({
        ...prev,
        [unitId]: { name: prev[unitId]?.name || '', serialNumber: '' },
      }));

      setAlertMsg({ text: `Berhasil menambahkan "${name}" (${serialNumber})`, type: 'success' });
      await refreshUnits();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menyimpan barang', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Item
  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${editingItem.unitId}/items/${editingItem.item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.item.name.trim(),
          serialNumber: editingItem.item.serialNumber.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengubah data barang');
      }

      setAlertMsg({ text: 'Data barang berhasil diperbarui', type: 'success' });
      setEditingItem(null);
      await refreshUnits();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal mengubah barang', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (unitId: string, itemId: string, itemName: string) => {
    if (!confirm(`Hapus baris "${itemName}" dari unit ini?`)) return;

    try {
      const res = await fetch(`/api/units/${unitId}/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus barang');
      setAlertMsg({ text: `Barang "${itemName}" berhasil dihapus`, type: 'info' });
      await refreshUnits();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menghapus barang', type: 'error' });
    }
  };

  // Handle Save Unit (Create or Update)
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
      } else {
        const res = await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, plateNumber }),
        });
        if (!res.ok) throw new Error('Gagal membuat unit baru');
        setAlertMsg({ text: `Unit "${name}" berhasil dibuat`, type: 'success' });
      }

      setUnitModalOpen(false);
      setEditingUnit(null);
      await refreshUnits();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menyimpan unit', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Unit
  const handleDeleteUnit = async (unit: Unit) => {
    if (!confirm(`Hapus seluruh tabel untuk "${unit.name}" beserta semua isinya?`)) return;

    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus unit');
      setAlertMsg({ text: `Unit "${unit.name}" berhasil dihapus`, type: 'info' });
      await refreshUnits();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menghapus unit', type: 'error' });
    }
  };

  // Export to CSV
  const exportAllCSV = () => {
    if (units.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    units.forEach((unit) => {
      csvContent += `"${unit.name}"\n`;
      csvContent += 'Nama Barang,Serial Number\n';
      (unit.items || []).forEach((item) => {
        csvContent += `"${(item.name || '').replace(/"/g, '""')}","${(item.serialNumber || '').replace(/"/g, '""')}"\n`;
      });
      csvContent += '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventori_Unit_Mobil_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-lg transition-all animate-fade-in ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : alertMsg.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800'
              : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="font-bold">
              {alertMsg.type === 'success' ? '✓' : alertMsg.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <p className="font-medium text-xs sm:text-sm">{alertMsg.text}</p>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Link href="/" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-500">Inventori Unit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white tracking-tight flex items-center gap-3">
            <span>Inventori Unit Mobil</span>
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2.5 py-0.5 rounded-full font-bold">
              {units.length} Unit
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Daftar isi peralatan dan barang per mobil (Nama Barang & Serial Number).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 print:hidden">
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
            <span>Tambah Unit Mobil</span>
          </button>

          <button
            onClick={exportAllCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Download Excel / CSV"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Cetak"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative max-w-md print:hidden">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama barang atau serial number di seluruh mobil..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
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

      {/* Excel-style Tables Grid (Side-by-Side as in the screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {units.map((unit) => {
          // Filter items of this unit if search query is active
          const unitItems = (unit.items || []).filter((item) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            return (
              (item.name || '').toLowerCase().includes(q) ||
              (item.serialNumber || '').toLowerCase().includes(q)
            );
          });

          const currentInputs = quickAdd[unit.id] || { name: '', serialNumber: '' };

          return (
            <div
              key={unit.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Unit Title Header (like the top cell in Excel: UNIT 9717 / UNIT 5852) */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight font-sans">
                    {unit.name}
                  </h2>
                  <span className="text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                    {unit.items?.length || 0} item
                  </span>
                </div>

                {/* Unit Edit / Delete actions */}
                <div className="flex items-center space-x-1 print:hidden">
                  <button
                    onClick={() => {
                      setEditingUnit(unit);
                      setUnitModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Ubah Nama Unit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    title="Hapus Unit Mobil Ini"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Table (Nama Barang | Serial Number) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                      <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 w-1/2">
                        Nama Barang
                      </th>
                      <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 w-1/3">
                        Serial Number
                      </th>
                      <th className="py-2 px-2 text-center w-12 print:hidden">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {unitItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400 italic text-xs">
                          {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada barang di mobil ini.'}
                        </td>
                      </tr>
                    ) : (
                      unitItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Nama Barang */}
                          <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                            {item.name}
                          </td>

                          {/* Serial Number */}
                          <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.serialNumber}
                          </td>

                          {/* Aksi (Edit / Hapus) */}
                          <td className="py-1 px-1.5 text-center print:hidden">
                            <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingItem({ unitId: unit.id, item: { ...item } })}
                                className="p-1 hover:text-blue-600 rounded"
                                title="Edit Baris"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(unit.id, item.id, item.name)}
                                className="p-1 hover:text-red-600 rounded"
                                title="Hapus Baris"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Inline Quick Add Row (Exactly like typing into the next row of Excel) */}
              <form
                onSubmit={(e) => handleQuickAddItem(unit.id, e)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 print:hidden"
              >
                <input
                  type="text"
                  required
                  placeholder="Nama Barang (e.g. MCMP-T)"
                  value={currentInputs.name}
                  onChange={(e) =>
                    setQuickAdd((prev) => ({
                      ...prev,
                      [unit.id]: { ...currentInputs, name: e.target.value },
                    }))
                  }
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Serial Number (e.g. 4444)"
                  value={currentInputs.serialNumber}
                  onChange={(e) =>
                    setQuickAdd((prev) => ({
                      ...prev,
                      [unit.id]: { ...currentInputs, serialNumber: e.target.value },
                    }))
                  }
                  className="w-28 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                  title="Tambah Baris"
                >
                  + Tambah
                </button>
              </form>
            </div>
          );
        })}

        {/* Empty state if no units exist */}
        {units.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">
            <p className="font-bold text-base text-slate-600 dark:text-slate-300 mb-2">
              Belum ada unit mobil yang dibuat.
            </p>
            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              + Tambah Unit Pertama
            </button>
          </div>
        )}
      </div>

      {/* ================= MODAL: Edit Item Baris ================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-blue-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Data Barang</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditItem} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.item.name}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.item.serialNumber}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, serialNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Tambah / Edit Unit Mobil ================= */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex items-center justify-between">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white uppercase font-bold"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
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
                  {submitting ? 'Menyimpan...' : editingUnit ? 'Simpan Perubahan' : 'Buat Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
