'use client';

import { useState, useMemo, useEffect } from 'react';
import ContactAdminModal from './ContactAdminModal';

export interface InventoryItem {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  location: string;
  rack: string;
  status: string;
  quantity?: number;
  minStock?: number;
  imageUrl?: string | null;
}

interface DashboardORingListProps {
  initialItems: InventoryItem[];
}

export default function DashboardORingList({ initialItems }: DashboardORingListProps) {
  const [role, setRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'checked_out'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'serialNumber' | 'name' | 'rack' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleCount, setVisibleCount] = useState(16);

  // Pop-up modal state for "Hubungi Admin"
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      setRole(roleCookie.split('=')[1]);
    }
  }, []);

  // Unique locations and categories for filter dropdowns
  const uniqueLocations = useMemo(() => {
    const set = new Set(initialItems.map((i) => i.location).filter(Boolean));
    return Array.from(set).sort();
  }, [initialItems]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(initialItems.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [initialItems]);

  // Reset pagination limit when search or filters change
  useEffect(() => {
    setVisibleCount(16);
  }, [searchQuery, statusFilter, locationFilter, categoryFilter]);

  // Filter items
  const filteredItems = useMemo(() => {
    let list = initialItems.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Location filter
      if (locationFilter !== 'all' && item.location !== locationFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      // Search filter across all attributes (Plat Number, Nama, Rak, Lokasi, Kategori)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchRack = (item.rack || '').toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        return matchSerial || matchName || matchRack || matchLoc || matchCat;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let valA: string | number = a[sortBy] ?? '';
      let valB: string | number = b[sortBy] ?? '';

      if (sortBy === 'quantity') {
        valA = a.quantity ?? 1;
        valB = b.quantity ?? 1;
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [initialItems, searchQuery, statusFilter, sortBy, sortOrder]);

  // Sliced items according to visibleCount
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Statistics
  const totalItemsCount = initialItems.length;
  const availableCount = initialItems.filter((i) => i.status === 'available').length;
  const checkedOutCount = initialItems.filter((i) => i.status === 'checked_out').length;
  const totalPcs = initialItems.reduce((acc, i) => acc + (i.quantity ?? 1), 0);
  const lowStockItems = initialItems.filter((i) => (i.quantity ?? 1) <= (i.minStock ?? 3) && i.status === 'available');

  const toggleSort = (field: 'serialNumber' | 'name' | 'rack' | 'quantity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleTakeItem = (item: InventoryItem) => {
    if (role === 'admin') {
      // Admin langsung diarahkan ke form scan/checkout
      window.location.href = `/scan/module-room?serial=${item.serialNumber}&action=checkout`;
    } else {
      // User / Viewer menampilkan pop-up "Hubungi Admin"
      setSelectedItemForAction(item);
      setModalOpen(true);
    }
  };

  // Export filtered items to Excel-ready CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert('Tidak ada data barang untuk diekspor');
      return;
    }
    const headers = ['Plat Number', 'Nama Barang', 'Kategori', 'Lokasi', 'Rak', 'Stok (Pcs)', 'Status'];
    const rows = filteredItems.map((item) => [
      `"${(item.serialNumber || '').replace(/"/g, '""')}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.location || '').replace(/"/g, '""')}"`,
      `"${(item.rack || '').replace(/"/g, '""')}"`,
      item.quantity ?? 1,
      item.status === 'available' ? '"Tersedia"' : '"Habis / Dipinjam"',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daftar-inventaris-barang-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                Daftar Inventaris
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                Daftar Inventaris Barang
              </h2>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                {totalItemsCount} Varian
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                Total {totalPcs} Pcs
              </span>
              {lowStockItems.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
                  ⚠ {lowStockItems.length} Stok Rendah
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Daftar stok dan ketersediaan barang inventaris.
            </p>
          </div>

          {/* Ekspor CSV Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start md:self-auto cursor-pointer"
              title="Unduh daftar inventaris barang yang difilter ke format Excel / CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Ekspor CSV Barang</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Bar (Global: Plat Number, Nama, Rak, Lokasi, Kategori) */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Plat Number, Nama, Rak, Lokasi, Kategori..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs font-semibold text-slate-600">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                Semua ({totalItemsCount})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'available' ? 'bg-white text-green-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                Tersedia ({availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('checked_out')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'checked_out' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                Habis ({checkedOutCount})
              </button>
            </div>
          </div>

          {/* Secondary Filters: Lokasi & Kategori Dropdowns + Active Filter Counter & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Lokasi Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Lokasi:</span>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                >
                  <option value="all">Semua Lokasi</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Kategori:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                >
                  <option value="all">Semua Kategori</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filter Button */}
              {(searchQuery || statusFilter !== 'all' || locationFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setLocationFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-colors flex items-center gap-1"
                >
                  <span>✕</span>
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Results Counter */}
            <div className="text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{filteredItems.length}</span> dari {totalItemsCount} varian barang
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DAFTAR BARISAN KE BAWAH (DESKTOP TABLE + MOBILE ROWS)    */}
      {/* ======================================================== */}

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="mx-6 mb-0 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
          <span className="text-amber-600 text-lg mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Peringatan Stok Rendah</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lowStockItems.length} barang memiliki stok di bawah batas minimum:{' '}
              <span className="font-semibold">{lowStockItems.map((i) => i.name || i.serialNumber).join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <tr>
              <th
                onClick={() => toggleSort('serialNumber')}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Plat Number</span>
                  {sortBy === 'serialNumber' && (
                    <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort('name')}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Barang</span>
                  {sortBy === 'name' && (
                    <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort('rack')}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Rak / Lokasi</span>
                  {sortBy === 'rack' && (
                    <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort('quantity')}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Sisa Stok</span>
                  {sortBy === 'quantity' && (
                    <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-center">Status</th>
              <th className="px-6 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => {
              const qty = item.quantity ?? 1;
              const isAvailable = item.status === 'available' && qty > 0;

              return (
                <tr key={item.id || item.serialNumber} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-900 tracking-wide text-sm bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {item.serialNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        {item.category && (
                          <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.rack}
                      </span>
                      {item.location && (
                        <span className="text-xs text-slate-400">({item.location})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-bold ${
                          isAvailable
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {qty} pcs
                      </span>
                      {qty <= (item.minStock ?? 3) && isAvailable && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">
                          ⚠ Stok Rendah
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isAvailable ? 'Tersedia' : 'Habis'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAvailable ? (
                      <button
                        onClick={() => handleTakeItem(item)}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Ambil Barang</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-md">Habis</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Row List View */}
      <div className="md:hidden divide-y divide-slate-100">
        {visibleItems.map((item) => {
          const qty = item.quantity ?? 1;
          const isAvailable = item.status === 'available' && qty > 0;

          return (
            <div key={item.id || item.serialNumber} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0 mt-0.5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {item.serialNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{item.name}</h3>
                    {item.category && (
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAvailable ? 'Tersedia' : 'Habis'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {item.rack} {item.location ? `• ${item.location}` : ''}
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {qty} <span className="text-xs font-normal text-slate-500">pcs</span>
                  </span>
                  {qty <= (item.minStock ?? 3) && isAvailable && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">
                      ⚠ Stok Rendah
                    </span>
                  )}
                </div>
              </div>

              <div>
                {isAvailable ? (
                  <button
                    onClick={() => handleTakeItem(item)}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Ambil Barang</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed text-center"
                  >
                    Stok Habis
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More & Pagination Bar */}
      {filteredItems.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-800">{visibleItems.length}</strong> dari{' '}
            <strong className="text-slate-800">{filteredItems.length}</strong> barang
          </span>
          <div className="flex items-center gap-2">
            {visibleCount < filteredItems.length && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 16)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Tampilkan Lebih Banyak ({filteredItems.length - visibleCount} lagi)
              </button>
            )}
            {visibleCount > 16 && (
              <button
                onClick={() => setVisibleCount(16)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-all"
              >
                Tampilkan 16 Awal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          <p className="text-sm font-medium">Tidak ada barang O-Ring yang sesuai dengan pencarian.</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      )}

      {/* POP-UP MODAL "HUBUNGI ADMIN" */}
      <ContactAdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedItemForAction}
      />
    </div>
  );
}
