'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

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

interface LogActivityViewProps {
  initialLogs: LogEntry[];
}

const PALETTE_COLORS = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function LogActivityView({ initialLogs }: LogActivityViewProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isLive, setIsLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '7d' | 'today'>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'checkout' | 'return'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch latest logs
  const fetchLogs = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/logs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Gagal mengambil data logs:', err);
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Polling every 5 seconds if live mode is enabled
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, fetchLogs]);

  // Clear all logs
  const handleClearLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat keluar-masuk barang? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        alert('Semua riwayat aktivitas berhasil dibersihkan.');
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus riwayat');
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsClearing(false);
    }
  };

  // Filter logs by selected time range
  const timeFilteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      if (timeFilter === 'today') {
        return logDate.toDateString() === now.toDateString();
      }
      if (timeFilter === '7d') {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeFilter === '30d') {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [logs, timeFilter]);

  // Analyze checkouts (Ambil Barang)
  const checkoutAnalytics = useMemo(() => {
    const checkoutLogs = timeFilteredLogs.filter((l) => l.action === 'checkout');
    const totalPcsTaken = checkoutLogs.reduce((sum, l) => sum + (l.quantity || 1), 0);
    const totalTransactions = checkoutLogs.length;

    // Group by Serial Number & Name
    const itemMap: Record<
      string,
      { serialNumber: string; itemName: string; totalQty: number; txCount: number }
    > = {};

    checkoutLogs.forEach((log) => {
      const key = log.serialNumber.toUpperCase();
      const qty = log.quantity || 1;

      if (!itemMap[key]) {
        itemMap[key] = {
          serialNumber: log.serialNumber,
          itemName: log.itemName,
          totalQty: 0,
          txCount: 0,
        };
      }
      itemMap[key].totalQty += qty;
      itemMap[key].txCount += 1;
    });

    const rankedItems = Object.values(itemMap).sort((a, b) => b.totalQty - a.totalQty);
    const topItem = rankedItems[0] || null;

    return {
      totalPcsTaken,
      totalTransactions,
      rankedItems,
      topItem,
    };
  }, [timeFilteredLogs]);

  // Slices data for circular diagram (pie / donut)
  const pieSlices = useMemo(() => {
    const total = checkoutAnalytics.totalPcsTaken;
    if (total === 0) return [];

    const radius = 80;
    const circumference = 2 * Math.PI * radius; // ~502.65
    let currentOffset = 0;

    return checkoutAnalytics.rankedItems.map((item, idx) => {
      const percent = (item.totalQty / total) * 100;
      const strokeLength = (percent / 100) * circumference;
      const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      const strokeDashoffset = -currentOffset;
      const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];

      currentOffset += strokeLength;

      return {
        ...item,
        percent,
        color,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [checkoutAnalytics]);

  // Filtered logs for the table view
  const tableLogs = useMemo(() => {
    return timeFilteredLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSerial = log.serialNumber.toLowerCase().includes(q);
        const matchName = log.itemName.toLowerCase().includes(q);
        const matchPerson = log.person.toLowerCase().includes(q);
        const matchLocation = log.location.toLowerCase().includes(q);
        return matchSerial || matchName || matchPerson || matchLocation;
      }
      return true;
    });
  }, [timeFilteredLogs, actionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Live Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
        <div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-xs font-semibold mb-1.5 inline-flex items-center gap-1 transition-colors"
          >
            &larr; Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
              Log Activity &amp; Analisis
            </h1>
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live Real-time</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span>Jeda</span>
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Pantau statistik penggunaan barang dan riwayat keluar-masuk secara langsung.
          </p>
        </div>

        {/* Real-time Controls & Time Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time filter selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTimeFilter('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === '30d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setTimeFilter('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === '7d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Hari Ini
            </button>
          </div>

          {/* Toggle Live */}
          <button
            onClick={() => setIsLive(!isLive)}
            title={isLive ? 'Jeda pembaruan otomatis' : 'Aktifkan pembaruan otomatis tiap 5 detik'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            {isLive ? 'Auto 5s' : 'Pause'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
          </button>

          {/* Bersihkan Riwayat Button */}
          <button
            onClick={handleClearLogs}
            disabled={isClearing || logs.length === 0}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{isClearing ? 'Membersihkan...' : 'Bersihkan Riwayat'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Diambil */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Total Diambil
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              Q
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-blue-950 font-mono">
              {checkoutAnalytics.totalPcsTaken}
            </span>
            <span className="text-xs font-bold text-blue-700">pcs</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-1">
            dari {checkoutAnalytics.totalTransactions}x transaksi pengambilan
          </p>
        </div>

        {/* Paling Banyak Dipakai */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Paling Banyak Dipakai
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              #1
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-amber-950 font-mono block truncate">
              {checkoutAnalytics.topItem ? checkoutAnalytics.topItem.serialNumber : '-'}
            </span>
            <p className="text-xs font-semibold text-amber-800 mt-0.5 truncate">
              {checkoutAnalytics.topItem
                ? `${checkoutAnalytics.topItem.totalQty} pcs (${checkoutAnalytics.topItem.itemName})`
                : 'Belum ada data'}
            </p>
          </div>
        </div>

        {/* Variasi Item Dipakai */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50/70 border border-purple-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
              Variasi Item Dipakai
            </span>
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              V
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-purple-950 font-mono">
              {checkoutAnalytics.rankedItems.length}
            </span>
            <span className="text-xs font-bold text-purple-700">jenis</span>
          </div>
          <p className="text-[11px] text-purple-600 mt-1">
            Status update: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>

      {/* DIAGRAM LINGKARAN (PIE / DONUT CHART) BERUPA PERSENTASE */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
              <span>Diagram Lingkaran Persentase Penggunaan O-Ring</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                Real-time
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Proporsi persentase setiap O-Ring terhadap total barang yang diambil.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Total {checkoutAnalytics.totalPcsTaken} pcs dihitung
          </span>
        </div>

        {checkoutAnalytics.totalPcsTaken === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300 mx-auto flex items-center justify-center text-slate-300 font-mono text-xl">
              0%
            </div>
            <p className="font-semibold text-slate-600">Belum ada data pengambilan barang.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Diagram lingkaran persentase akan terisi otomatis secara real-time begitu ada barang yang diambil.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual SVG Circular / Donut Diagram */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <svg
                  viewBox="0 0 220 220"
                  className="w-full h-full -rotate-90 transform drop-shadow-sm"
                >
                  {/* Background Track */}
                  <circle
                    cx="110"
                    cy="110"
                    r="80"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="28"
                  />
                  {/* Slices */}
                  {pieSlices.map((slice) => (
                    <circle
                      key={slice.serialNumber}
                      cx="110"
                      cy="110"
                      r="80"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="28"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  ))}
                </svg>

                {/* Donut Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Diambil
                  </span>
                  <span className="text-3xl font-black text-blue-950 font-mono">
                    {checkoutAnalytics.totalPcsTaken}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5">
                    100% Selesai
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                Menampilkan proporsi dari {checkoutAnalytics.rankedItems.length} jenis item O-Ring
              </p>
            </div>

            {/* Legend & Breakdown List with Percentage */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between px-1">
                <span>Item &amp; Spesifikasi</span>
                <span>Jumlah &amp; Persentase</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {pieSlices.map((slice, idx) => (
                  <div
                    key={slice.serialNumber}
                    className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Color indicator block */}
                      <span
                        className="w-4 h-4 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: slice.color }}
                      />

                      {/* Rank tag */}
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>

                      {/* Item Details */}
                      <div className="min-w-0">
                        <span className="font-mono font-black text-blue-950 text-sm tracking-wide block truncate">
                          {slice.serialNumber}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">
                          {slice.itemName}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Percentage Badge */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {slice.totalQty} <span className="text-xs font-medium text-slate-500 font-sans">pcs</span>
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {slice.txCount}x transaksi
                        </span>
                      </div>

                      {/* Big Percentage Badge */}
                      <span
                        className="text-xs font-black px-2.5 py-1 rounded-lg font-mono text-white min-w-[56px] text-center shadow-sm"
                        style={{ backgroundColor: slice.color }}
                      >
                        {slice.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABEL LOG RIWAYAT AKTIVITAS */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden space-y-4 p-6">
        {/* Table Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-blue-950">
              Riwayat Transaksi Keluar / Masuk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {tableLogs.length} transaksi dari total {timeFilteredLogs.length} data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SN, Petugas, Nama..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-48 sm:w-60"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">
                Q
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-[10px] bg-slate-200 text-slate-600 px-1 rounded font-bold"
                >
                  X
                </button>
              )}
            </div>

            {/* Action Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActionFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  actionFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActionFilter('checkout')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  actionFilter === 'checkout'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-red-600'
                }`}
              >
                Ambil
              </button>
              <button
                onClick={() => setActionFilter('return')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  actionFilter === 'return'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                Kembali
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-50/80 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Jumlah (Pcs)</th>
                <th className="px-4 py-3">Plat Number</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {tableLogs.map((log) => {
                const isCheckout = log.action === 'checkout';
                return (
                  <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{log.person}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          isCheckout
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isCheckout ? 'Ambil' : 'Kembali'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-black text-blue-950 text-sm">
                        {log.quantity ?? 1}{' '}
                        <span className="text-xs font-normal text-slate-500">pcs</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {log.serialNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.itemName}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.location}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {tableLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Tidak ada riwayat aktivitas.
          </div>
        )}
      </div>
    </div>
  );
}
