'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'checked_out'>('all');
  const [sortBy, setSortBy] = useState<'serialNumber' | 'name' | 'rack' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleCount, setVisibleCount] = useState(15);

  // Reset pagination limit when search or status filter changes
  useEffect(() => {
    setVisibleCount(15);
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

  // Sliced items according to visibleCount (default 15)
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-blue-950">Daftar Inventaris O-Ring</h2>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                {totalItemsCount} Varian
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                Total {totalPcs} Pcs
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Data stok barang O-Ring, sisa pcs, posisi rak, dan status ketersediaan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/location/module-room"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Buka Lemari Module Room</span>
            </Link>
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
              placeholder="Cari Serial Number, Nama O-Ring, atau Rak (Contoh: Rak - A1)..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
          <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start md:self-auto text-xs font-semibold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              Semua ({totalItemsCount})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'available' ? 'bg-white text-green-700 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter('checked_out')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'checked_out' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              None ({checkedOutCount})
            </button>
          </div>
        </div>
      </div>

      {/* Table Section (Desktop View) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <tr>
              <th
                onClick={() => toggleSort('serialNumber')}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Serial Number</span>
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
                  <span>Rak</span>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => {
              const qty = item.quantity ?? 1;
              const isAvailable = item.status === 'available';

              return (
                <tr key={item.id || item.serialNumber} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-900 tracking-wide text-sm">
                      {item.serialNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.rack}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-bold ${
                        isAvailable && qty > 0
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
                      {isAvailable ? 'Available' : 'None'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards Section (Mobile View) */}
      <div className="md:hidden divide-y divide-slate-100">
        {visibleItems.map((item) => {
          const qty = item.quantity ?? 1;
          const isAvailable = item.status === 'available';

          return (
            <div key={item.id || item.serialNumber} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-bold text-blue-900 text-sm">
                    {item.serialNumber}
                  </div>
                  <div className="text-sm font-medium text-slate-800">{item.name}</div>
                </div>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAvailable ? 'Available' : 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  {item.rack}
                </span>
                <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {qty} pcs
                </span>
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
                onClick={() => setVisibleCount((prev) => prev + 15)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Show More
              </button>
            )}
            {visibleCount > 15 && (
              <button
                onClick={() => setVisibleCount(15)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all"
              >
                Tampilkan 15 Awal
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
    </div>
  );
}
