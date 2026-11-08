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
}

interface DashboardORingListProps {
  initialItems: InventoryItem[];
}

export default function DashboardORingList({ initialItems }: DashboardORingListProps) {
  const [role, setRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'checked_out'>('all');
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

  // Reset pagination limit when search or status filter changes
  useEffect(() => {
    setVisibleCount(16);
  }, [searchQuery, statusFilter]);

  // Filter items
  const filteredItems = useMemo(() => {
    let list = initialItems.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSerial = item.serialNumber.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchRack = item.rack.toLowerCase().includes(q);
        return matchSerial || matchName || matchRack;
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
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Daftar stok dan ketersediaan barang inventaris.
            </p>
          </div>


        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Plat Number, Nama O-Ring, atau Rak..."
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
      </div>

      {/* ======================================================== */}
      {/* DAFTAR BARISAN KE BAWAH (DESKTOP TABLE + MOBILE ROWS)    */}
      {/* ======================================================== */}

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
                    <div>
                      <span className="font-semibold text-slate-900 block">{item.name}</span>
                      {item.category && (
                        <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                      )}
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
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-bold ${
                        isAvailable
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {qty} pcs
                    </span>
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
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    {item.serialNumber}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{item.name}</h3>
                  {item.category && (
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  )}
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
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {qty} <span className="text-xs font-normal text-slate-500">pcs</span>
                </span>
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
