'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

export interface UnitItem {
  id: string;
  unitId: string;
  serialNumber: string;
  name: string;
  category: string;
  compartment: string;
  quantity: number;
  unitType: string;
  minStock: number;
  condition: string;
  status: string; // "available", "in_use", "missing"
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Unit {
  id: string;
  name: string;
  plateNumber?: string | null;
  vehicleType?: string | null;
  driver?: string | null;
  status: string; // "active", "standby", "maintenance"
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  items?: UnitItem[];
}

export interface LogEntry {
  id: string;
  serialNumber: string;
  itemName: string;
  action: string;
  person: string;
  location: string;
  quantity?: number;
  timestamp: string | Date;
}

interface UnitInventoryViewProps {
  initialUnits: Unit[];
  initialLogs?: LogEntry[];
  userRole?: string | null;
}

const CATEGORY_OPTIONS = [
  'Lifting & Rigging',
  'Hand Tools',
  'Power Tools',
  'Electrical & Test',
  'Safety & PPE',
  'Safety & Emergency',
  'Consumables',
  'Maintenance',
  'Equipment',
  'Spareparts',
  'Lainnya',
];

const COMPARTMENT_OPTIONS = [
  'Bagasi Belakang',
  'Box Perkakas Kiri',
  'Box Perkakas Kanan',
  'Kabin Depan (Dashboard)',
  'Kabin Depan (Samping Driver)',
  'Kabin Belakang',
  'Underbed Box',
  'Rak Perkakas Samping',
  'Lainnya',
];

export default function UnitInventoryView({
  initialUnits,
  initialLogs = [],
  userRole,
}: UnitInventoryViewProps) {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialUnits.length > 0 ? initialUnits[0].id : ''
  );
  const [role, setRole] = useState<string | null>(userRole || null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [compartmentFilter, setCompartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'serial' | 'compartment' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnitItem | null>(null);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<UnitItem | null>(null);
  const [actionType, setActionType] = useState<'checkout' | 'return'>('checkout');
  const [actionQty, setActionQty] = useState(1);
  const [actionPerson, setActionPerson] = useState('');
  const [actionNote, setActionNote] = useState('');

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    type: 'unit' | 'item';
    id: string;
    name: string;
  }>({ open: false, type: 'item', id: '', name: '' });

  // Notifications
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Read role cookie on client
  useEffect(() => {
    if (!role) {
      const cookies = document.cookie.split(';');
      const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
      if (roleCookie) {
        setRole(roleCookie.split('=')[1]);
      }
    }
  }, [role]);

  // Selected Unit
  const currentUnit = useMemo(() => {
    return units.find((u) => u.id === selectedUnitId) || units[0] || null;
  }, [units, selectedUnitId]);

  // Current items of active unit
  const items = useMemo(() => {
    return currentUnit?.items || [];
  }, [currentUnit]);

  // Auto-clear notification alert after 4 seconds
  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  // Filter & Search Items
  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      // Compartment filter
      if (compartmentFilter !== 'all' && item.compartment !== compartmentFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      // Condition filter
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = (item.name || '').toLowerCase().includes(q);
        const mSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const mComp = (item.compartment || '').toLowerCase().includes(q);
        const mCat = (item.category || '').toLowerCase().includes(q);
        const mNotes = (item.notes || '').toLowerCase().includes(q);
        return mName || mSerial || mComp || mCat || mNotes;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'quantity') {
        const diff = (a.quantity || 0) - (b.quantity || 0);
        return sortOrder === 'asc' ? diff : -diff;
      }
      let valA = '';
      let valB = '';
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'serial') {
        valA = a.serialNumber.toLowerCase();
        valB = b.serialNumber.toLowerCase();
      } else if (sortBy === 'compartment') {
        valA = a.compartment.toLowerCase();
        valB = b.compartment.toLowerCase();
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return list;
  }, [items, categoryFilter, compartmentFilter, statusFilter, conditionFilter, searchQuery, sortBy, sortOrder]);

  // Statistics for active unit
  const stats = useMemo(() => {
    const totalTypes = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const availableTypes = items.filter((i) => i.status === 'available').length;
    const inUseTypes = items.filter((i) => i.status === 'in_use').length;
    const lowStockItems = items.filter((i) => (i.quantity || 0) <= (i.minStock || 1));
    return {
      totalTypes,
      totalQuantity,
      availableTypes,
      inUseTypes,
      lowStockCount: lowStockItems.length,
    };
  }, [items]);

  // Unique categories & compartments for active unit filters
  const uniqueCategories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const uniqueCompartments = useMemo(() => {
    const set = new Set(items.map((i) => i.compartment).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  // Refresh units from backend
  const refreshUnits = async (selectId?: string) => {
    try {
      const res = await fetch('/api/units', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUnits(data);
          if (selectId) {
            setSelectedUnitId(selectId);
          } else if (data.length > 0 && !data.some((u: Unit) => u.id === selectedUnitId)) {
            setSelectedUnitId(data[0].id);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  // Handle Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUnit) return;
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      serialNumber: formData.get('serialNumber')?.toString() || '',
      name: formData.get('name')?.toString() || '',
      category: formData.get('category')?.toString() || 'Tools',
      compartment: formData.get('compartment')?.toString() || 'Bagasi Belakang',
      quantity: parseInt(formData.get('quantity')?.toString() || '1', 10),
      unitType: formData.get('unitType')?.toString() || 'Pcs',
      minStock: parseInt(formData.get('minStock')?.toString() || '1', 10),
      condition: formData.get('condition')?.toString() || 'Good',
      status: formData.get('status')?.toString() || 'available',
      notes: formData.get('notes')?.toString() || '',
      person: role || 'Petugas',
    };

    try {
      if (editingItem) {
        // Edit Item
        const res = await fetch(`/api/units/${currentUnit.id}/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengubah barang');
        }
        setAlertMsg({ text: `Barang "${payload.name}" berhasil diperbarui`, type: 'success' });
      } else {
        // Create Item
        const res = await fetch(`/api/units/${currentUnit.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambahkan barang');
        }
        setAlertMsg({ text: `Barang "${payload.name}" berhasil ditambahkan ke ${currentUnit.name}`, type: 'success' });
      }

      setItemModalOpen(false);
      setEditingItem(null);
      await refreshUnits(currentUnit.id);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Terjadi kesalahan saat menyimpan barang', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Unit (Create or Update)
  const handleSaveUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get('name')?.toString() || '',
      plateNumber: formData.get('plateNumber')?.toString() || '',
      vehicleType: formData.get('vehicleType')?.toString() || '',
      driver: formData.get('driver')?.toString() || '',
      status: formData.get('status')?.toString() || 'active',
      notes: formData.get('notes')?.toString() || '',
    };

    try {
      if (editingUnit) {
        // Update Unit
        const res = await fetch(`/api/units/${editingUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengubah unit');
        }
        setAlertMsg({ text: `Unit "${payload.name}" berhasil diperbarui`, type: 'success' });
        await refreshUnits(editingUnit.id);
      } else {
        // Create Unit
        const res = await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal membuat unit mobil baru');
        }
        const created = await res.json();
        setAlertMsg({ text: `Unit mobil "${payload.name}" berhasil dibuat`, type: 'success' });
        await refreshUnits(created.id);
      }

      setUnitModalOpen(false);
      setEditingUnit(null);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Terjadi kesalahan saat menyimpan unit mobil', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Action (Ambil / Kembalikan)
  const handleItemAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnit || !selectedItemForAction) return;
    if (actionQty <= 0) {
      setAlertMsg({ text: 'Jumlah harus lebih besar dari 0', type: 'error' });
      return;
    }
    if (!actionPerson.trim()) {
      setAlertMsg({ text: 'Nama petugas / pengambil wajib diisi', type: 'error' });
      return;
    }

    setSubmitting(true);
    const delta = actionType === 'checkout' ? -actionQty : actionQty;

    try {
      const res = await fetch(`/api/units/${currentUnit.id}/items/${selectedItemForAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta,
          person: actionPerson.trim(),
          actionType: actionType === 'checkout' ? 'checkout' : 'return',
          note: actionNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memproses transaksi barang');
      }

      const actionText = actionType === 'checkout' ? 'diambil dari' : 'dikembalikan ke';
      setAlertMsg({
        text: `${actionQty} ${selectedItemForAction.unitType} "${selectedItemForAction.name}" berhasil ${actionText} ${currentUnit.name}`,
        type: 'success',
      });

      setActionModalOpen(false);
      setSelectedItemForAction(null);
      setActionNote('');
      await refreshUnits(currentUnit.id);
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal memproses transaksi', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteConfirmModal.id) return;
    setSubmitting(true);

    try {
      if (deleteConfirmModal.type === 'unit') {
        const res = await fetch(`/api/units/${deleteConfirmModal.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus unit mobil');
        setAlertMsg({ text: `Unit "${deleteConfirmModal.name}" berhasil dihapus`, type: 'info' });
        await refreshUnits();
      } else {
        if (!currentUnit) return;
        const res = await fetch(
          `/api/units/${currentUnit.id}/items/${deleteConfirmModal.id}?person=${encodeURIComponent(
            role || 'Petugas'
          )}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error('Gagal menghapus barang dari unit');
        setAlertMsg({
          text: `Barang "${deleteConfirmModal.name}" berhasil dihapus dari ${currentUnit.name}`,
          type: 'info',
        });
        await refreshUnits(currentUnit.id);
      }
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'Gagal menghapus', type: 'error' });
    } finally {
      setSubmitting(false);
      setDeleteConfirmModal({ open: false, type: 'item', id: '', name: '' });
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!currentUnit || items.length === 0) return;
    const headers = [
      'No',
      'No. Seri / Part Number',
      'Nama Barang',
      'Kategori',
      'Posisi di Mobil',
      'Jumlah',
      'Satuan',
      'Min Stok',
      'Kondisi',
      'Status',
      'Catatan',
    ];

    const rows = items.map((i, idx) => [
      idx + 1,
      `"${(i.serialNumber || '').replace(/"/g, '""')}"`,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${(i.compartment || '').replace(/"/g, '""')}"`,
      i.quantity ?? 1,
      `"${i.unitType || 'Pcs'}"`,
      i.minStock ?? 1,
      `"${i.condition || 'Good'}"`,
      `"${i.status === 'available' ? 'Tersedia' : 'Dipakai'}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventori_${currentUnit.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Checklist
  const handlePrint = () => {
    window.print();
  };

  // Suggested Serial generator
  const getSuggestedSerial = () => {
    if (!currentUnit) return `UNT-${Date.now().toString().slice(-4)}`;
    const prefix = currentUnit.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const count = items.length + 1;
    return `${prefix.slice(0, 4)}-${String(count).padStart(3, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification Toast */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all animate-fade-in ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : alertMsg.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800'
              : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">
              {alertMsg.type === 'success' ? '✓' : alertMsg.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <p className="font-semibold text-sm">{alertMsg.text}</p>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-xs font-bold px-2 py-1 rounded hover:bg-black/10 transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Link href="/" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-500">Inventori Unit Mobil</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white tracking-tight flex items-center gap-3">
            <span>Inventori Unit Mobil</span>
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full font-bold">
              {units.length} Unit Terdaftar
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pencatatan daftar muatan, perkakas, dan peralatan yang dibawa pada setiap unit mobil operasional.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={() => {
              setEditingUnit(null);
              setUnitModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Mobil Baru</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setItemModalOpen(true);
            }}
            disabled={!currentUnit}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Barang ke Mobil</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={items.length === 0}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            title="Download CSV Excel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={items.length === 0}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            title="Cetak Lembar Checklist"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden sm:inline">Cetak Checklist</span>
          </button>
        </div>
      </div>

      {/* Unit Selector Tabs */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pilih Unit Mobil:
          </span>
          <span className="text-xs text-slate-400">
            Klik unit untuk melihat daftar inventori
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {units.map((unit) => {
            const isSelected = unit.id === selectedUnitId;
            const count = unit.items?.length || 0;
            return (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-blue-500/30 font-bold scale-[1.02]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {/* Truck icon */}
                <svg
                  className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                </svg>
                <span>{unit.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count} item
                </span>
                {unit.plateNumber && (
                  <span
                    className={`text-[11px] font-mono font-normal opacity-80 hidden md:inline ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    ({unit.plateNumber})
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => {
              setEditingUnit(null);
              setUnitModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-dashed border-blue-300 dark:border-blue-800 flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <span>+ Mobil Baru</span>
          </button>
        </div>
      </div>

      {/* Active Unit Info Card & Stats */}
      {currentUnit && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentUnit.name}
                  </h2>
                  {currentUnit.plateNumber && (
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs rounded border border-slate-200 dark:border-slate-700">
                      {currentUnit.plateNumber}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      currentUnit.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : currentUnit.status === 'maintenance'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {currentUnit.status === 'active'
                      ? 'Aktif / Operasional'
                      : currentUnit.status === 'maintenance'
                      ? 'Perawatan / Servis'
                      : 'Standby'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {[
                    currentUnit.vehicleType,
                    currentUnit.driver ? `PIC: ${currentUnit.driver}` : null,
                    currentUnit.notes,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
              </div>
            </div>

            {/* Edit / Delete Unit Actions */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => {
                  setEditingUnit(currentUnit);
                  setUnitModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Info Mobil</span>
              </button>

              <button
                onClick={() =>
                  setDeleteConfirmModal({
                    open: true,
                    type: 'unit',
                    id: currentUnit.id,
                    name: currentUnit.name,
                  })
                }
                className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                title="Hapus Unit Mobil"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Hapus Unit</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Macam Barang
              </span>
              <span className="text-2xl font-bold text-blue-950 dark:text-blue-100">
                {stats.totalTypes} <span className="text-xs font-normal text-slate-500">Item</span>
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Unit Fisik (Qty)
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalQuantity} <span className="text-xs font-normal text-slate-500">Pcs/Set</span>
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Barang Siap / Tersedia
              </span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.availableTypes} <span className="text-xs font-normal text-slate-500">Item</span>
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                stats.inUseTypes > 0 || stats.lowStockCount > 0
                  ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="text-[11px] font-semibold block">
                Dipakai / Kurang
              </span>
              <span className="text-2xl font-bold">
                {stats.inUseTypes}{' '}
                <span className="text-xs font-normal opacity-80">
                  {stats.lowStockCount > 0 ? `(${stats.lowStockCount} menipis)` : ''}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, nomor part, posisi di mobil..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
            >
              <option value="all">Semua Kategori</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Compartment Filter */}
          <div>
            <select
              value={compartmentFilter}
              onChange={(e) => setCompartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
            >
              <option value="all">Semua Posisi / Kompartemen</option>
              {uniqueCompartments.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="available">Tersedia (Ready)</option>
              <option value="in_use">Dipakai Lapangan</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <span>Menampilkan:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredItems.length} dari {items.length} item
            </span>
            {(searchQuery || categoryFilter !== 'all' || compartmentFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setCompartmentFilter('all');
                  setStatusFilter('all');
                  setConditionFilter('all');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-2"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span>Urutkan:</span>
              <button
                onClick={() => {
                  if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('name');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2 py-1 rounded font-medium ${
                  sortBy === 'name' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold' : ''
                }`}
              >
                Nama {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'compartment') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('compartment');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2 py-1 rounded font-medium ${
                  sortBy === 'compartment'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold'
                    : ''
                }`}
              >
                Posisi {sortBy === 'compartment' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'quantity') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('quantity');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2 py-1 rounded font-medium ${
                  sortBy === 'quantity'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold'
                    : ''
                }`}
              >
                Jumlah {sortBy === 'quantity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold">DAFTAR INVENTORI KENDARAAN: {currentUnit?.name}</h2>
        <p className="text-xs text-gray-600">
          Plat: {currentUnit?.plateNumber || '-'} | Model: {currentUnit?.vehicleType || '-'} | PIC: {currentUnit?.driver || '-'} | Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* Main Inventory List Table ("Daftar saja tanpa ilustrasi apa-apa") */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-28">No. Part / Kode</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-3 w-32">Kategori</th>
                <th className="py-3 px-3">Posisi di Mobil</th>
                <th className="py-3 px-3 w-24 text-center">Jumlah</th>
                <th className="py-3 px-3 w-20 text-center">Kondisi</th>
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-3 w-40 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-base text-slate-600 dark:text-slate-300">
                        Belum ada barang di daftar
                      </p>
                      <p className="text-xs">
                        {searchQuery
                          ? 'Tidak ada barang yang cocok dengan kata kunci pencarian.'
                          : 'Mobil ini belum memiliki barang tercatat. Klik tombol di bawah untuk menambahkan barang pertama.'}
                      </p>
                      {!searchQuery && currentUnit && (
                        <button
                          onClick={() => {
                            setEditingItem(null);
                            setItemModalOpen(true);
                          }}
                          className="mt-3 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          + Tambah Barang Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isLow = (item.quantity || 0) <= (item.minStock || 1);
                  const isOut = (item.quantity || 0) <= 0;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Part Number / Serial */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 text-[11px] block text-center truncate max-w-[120px]">
                          {item.serialNumber}
                        </span>
                      </td>

                      {/* Nama Barang */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">
                            {item.notes}
                          </p>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Posisi Kompartemen di Mobil */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium text-xs">{item.compartment}</span>
                        </div>
                      </td>

                      {/* Jumlah Qty */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center space-x-1 font-bold">
                          <span
                            className={`text-sm ${
                              isOut
                                ? 'text-red-600 dark:text-red-400 font-extrabold'
                                : isLow
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {item.unitType || 'Pcs'}
                          </span>
                        </div>
                        {isLow && !isOut && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-tight">
                            Stok Tipis
                          </span>
                        )}
                        {isOut && (
                          <span className="block text-[10px] text-red-600 dark:text-red-400 font-semibold leading-tight">
                            Habis
                          </span>
                        )}
                      </td>

                      {/* Kondisi */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            item.condition.toLowerCase() === 'good' || item.condition.toLowerCase() === 'baik'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.condition.toLowerCase() === 'damaged' || item.condition.toLowerCase() === 'rusak'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.condition}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            item.status === 'available'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.status === 'available' ? 'Tersedia' : 'Dipakai'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center print:hidden">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Ambil / Kembalikan Dropdown/Button */}
                          <button
                            onClick={() => {
                              setSelectedItemForAction(item);
                              setActionType('checkout');
                              setActionQty(1);
                              setActionPerson(role || '');
                              setActionModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-900 transition-colors"
                            title="Ambil untuk dipakai di lapangan"
                          >
                            Ambil
                          </button>

                          <button
                            onClick={() => {
                              setSelectedItemForAction(item);
                              setActionType('return');
                              setActionQty(1);
                              setActionPerson(role || '');
                              setActionModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 rounded border border-emerald-200 dark:border-emerald-900 transition-colors"
                            title="Kembalikan barang ke mobil"
                          >
                            + Balik
                          </button>

                          {/* Edit Item */}
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setItemModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Edit Barang"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() =>
                              setDeleteConfirmModal({
                                open: true,
                                type: 'item',
                                id: item.id,
                                name: item.name,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Hapus Barang"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs Toggle */}
      {currentUnit && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Riwayat Aktivitas & Pergerakan Barang ({currentUnit.name})
              </h3>
            </div>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
            >
              {showLogs ? 'Sembunyikan Riwayat' : 'Lihat Riwayat Terakhir'}
            </button>
          </div>

          {showLogs && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-fade-in space-y-2">
              {initialLogs.filter((l) => l.location === currentUnit.name).length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Belum ada log aktivitas untuk unit ini. Transaksi ambil/kembalikan barang akan otomatis tercatat di sini.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {initialLogs
                    .filter((l) => l.location === currentUnit.name)
                    .slice(0, 10)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.action === 'checkout'
                                ? 'bg-amber-100 text-amber-800'
                                : log.action === 'return' || log.action === 'in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {log.itemName} ({log.quantity || 1} pcs)
                          </span>
                          <span className="text-slate-400">oleh</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {log.person}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: Tambah / Edit Barang ================= */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <h3 className="font-bold text-base">
                  {editingItem ? 'Edit Barang Unit Mobil' : `Tambah Barang ke ${currentUnit?.name}`}
                </h3>
              </div>
              <button
                onClick={() => setItemModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kode Part / Serial */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    No. Part / Kode Barang *
                  </label>
                  <div className="relative">
                    <input
                      name="serialNumber"
                      type="text"
                      required
                      defaultValue={editingItem?.serialNumber || getSuggestedSerial()}
                      placeholder="e.g. SLG-9717-01"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingItem?.category || 'Hand Tools'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Barang *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingItem?.name || ''}
                  placeholder="e.g. Webbing Sling Belt 3 Ton 5M"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Posisi / Kompartemen di Mobil */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Posisi / Kompartemen di Mobil *
                </label>
                <input
                  name="compartment"
                  type="text"
                  required
                  list="compartment-suggestions"
                  defaultValue={editingItem?.compartment || 'Bagasi Belakang'}
                  placeholder="e.g. Box Perkakas Kiri, Bagasi Belakang, Kabin Depan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
                <datalist id="compartment-suggestions">
                  {COMPARTMENT_OPTIONS.map((comp) => (
                    <option key={comp} value={comp} />
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Pilih dari daftar saran atau ketik letak spesifik di dalam mobil ini.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Jumlah (Quantity) */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Jumlah (Qty) *
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    required
                    defaultValue={editingItem?.quantity ?? 1}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white text-center font-bold"
                  />
                </div>

                {/* Satuan Unit */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Satuan
                  </label>
                  <select
                    name="unitType"
                    defaultValue={editingItem?.unitType || 'Pcs'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                    <option value="Roll">Roll</option>
                    <option value="Meter">Meter</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>

                {/* Minimum Stock Alert */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Batas Min Stok
                  </label>
                  <input
                    name="minStock"
                    type="number"
                    min="0"
                    defaultValue={editingItem?.minStock ?? 1}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Kondisi */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kondisi Fisik
                  </label>
                  <select
                    name="condition"
                    defaultValue={editingItem?.condition || 'Good'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="Good">Baik / Good</option>
                    <option value="Needs Check">Perlu Cek / Kalibrasi</option>
                    <option value="Damaged">Rusak / Damaged</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status Ketersediaan
                  </label>
                  <select
                    name="status"
                    defaultValue={editingItem?.status || 'available'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                  >
                    <option value="available">Tersedia (Ready di Mobil)</option>
                    <option value="in_use">Sedang Dipakai di Lapangan</option>
                  </select>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingItem?.notes || ''}
                  placeholder="e.g. Sertifikat kalibrasi aktif, perlengkapan wireline job..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Mobil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Ambil / Kembalikan Barang ================= */}
      {actionModalOpen && selectedItemForAction && currentUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                actionType === 'checkout'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                  : 'bg-gradient-to-r from-emerald-700 to-emerald-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {actionType === 'checkout' ? '📤' : '📥'}
                </span>
                <h3 className="font-bold text-sm">
                  {actionType === 'checkout'
                    ? `Ambil Barang dari ${currentUnit.name}`
                    : `Kembalikan Barang ke ${currentUnit.name}`}
                </h3>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleItemAction} className="p-5 space-y-4 text-xs">
              {/* Item Info Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Barang yang dipilih:
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedItemForAction.name}
                </p>
                <div className="flex items-center justify-between mt-1 text-slate-500 dark:text-slate-400">
                  <span>No. Seri: {selectedItemForAction.serialNumber}</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    Stok di Mobil: {selectedItemForAction.quantity} {selectedItemForAction.unitType}
                  </span>
                </div>
              </div>

              {/* Action Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionType('checkout')}
                  className={`py-1.5 font-bold rounded-lg transition-all ${
                    actionType === 'checkout'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ambil (Dipakai)
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('return')}
                  className={`py-1.5 font-bold rounded-lg transition-all ${
                    actionType === 'return'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Kembalikan
                </button>
              </div>

              {/* Qty Input */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Jumlah yang {actionType === 'checkout' ? 'diambil' : 'dikembalikan'} ({selectedItemForAction.unitType}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={actionType === 'checkout' ? selectedItemForAction.quantity : 9999}
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Person Input */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Petugas / Pengambil *
                </label>
                <input
                  type="text"
                  required
                  value={actionPerson}
                  onChange={(e) => setActionPerson(e.target.value)}
                  placeholder="e.g. Budi / Evra / Tim Wireline"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Note / Keperluan */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Keperluan / Lokasi Kerja (Opsional)
                </label>
                <input
                  type="text"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Pekerjaan Rig 02 / Maintenance mingguan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 font-bold text-white rounded-xl shadow-sm transition-all ${
                    actionType === 'checkout'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting
                    ? 'Memproses...'
                    : actionType === 'checkout'
                    ? 'Konfirmasi Pengambilan'
                    : 'Konfirmasi Pengembalian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Tambah / Edit Unit Mobil ================= */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                </svg>
                <h3 className="font-bold text-sm">
                  {editingUnit ? `Edit Info: ${editingUnit.name}` : 'Tambah Unit Mobil Baru'}
                </h3>
              </div>
              <button
                onClick={() => setUnitModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-5 space-y-4 text-xs">
              {/* Nama Unit */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Unit Mobil *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingUnit?.name || ''}
                  placeholder="e.g. Unit 9717 / Unit 9820 / Mobil Crane"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Plat Nomor */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Plat Nomor Kendaraan
                </label>
                <input
                  name="plateNumber"
                  type="text"
                  defaultValue={editingUnit?.plateNumber || ''}
                  placeholder="e.g. B 9717 SLB / KT 8820 XY"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white uppercase"
                />
              </div>

              {/* Tipe Kendaraan */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipe / Model Kendaraan
                </label>
                <input
                  name="vehicleType"
                  type="text"
                  defaultValue={editingUnit?.vehicleType || ''}
                  placeholder="e.g. Toyota Hilux 4x4 / Isuzu D-Max / Truck"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* PIC / Driver */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Driver / PIC Penanggung Jawab
                </label>
                <input
                  name="driver"
                  type="text"
                  defaultValue={editingUnit?.driver || ''}
                  placeholder="e.g. Tim Lapangan / Pak Slamet"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Status */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Status Operasional
                </label>
                <select
                  name="status"
                  defaultValue={editingUnit?.status || 'active'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                >
                  <option value="active">Aktif (Operasional di Lapangan)</option>
                  <option value="standby">Standby (Siaga di Pool / Base)</option>
                  <option value="maintenance">Perawatan (Servis di Bengkel)</option>
                </select>
              </div>

              {/* Catatan */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Keterangan Unit
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingUnit?.notes || ''}
                  placeholder="e.g. Khusus operasional wireline logging base 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all"
                >
                  {submitting ? 'Menyimpan...' : editingUnit ? 'Simpan Perubahan' : 'Buat Unit Mobil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Konfirmasi Hapus ================= */}
      {deleteConfirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 flex items-center justify-center mx-auto text-xl">
              🗑
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Konfirmasi Hapus {deleteConfirmModal.type === 'unit' ? 'Unit Mobil' : 'Barang'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  &ldquo;{deleteConfirmModal.name}&rdquo;
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ open: false, type: 'item', id: '', name: '' })}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="px-5 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-all"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
