import Link from 'next/link';
import { getStats, getCategories, getLocations, getItems } from '@/lib/db';
import DashboardORingList from '@/components/DashboardORingList';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getStats();
  const categories = await getCategories();
  const locations = await getLocations();
  const allItems = await getItems();

  const serializedItems = allItems.map((item) => ({
    id: item.id,
    serialNumber: item.serialNumber,
    name: item.name,
    category: item.category,
    location: item.location,
    rack: item.rack,
    status: item.status,
    quantity: item.quantity ?? 1,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Dashboard Inventory</h1>
        <p className="text-gray-500 mt-1">Sistem pengelolaan inventaris O-Ring dan Module Room</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5">
          <p className="text-sm text-gray-500">Total Item</p>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-5">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
          <p className="text-sm text-gray-500">Checked Out</p>
          <p className="text-3xl font-bold text-red-600">{stats.checkedOut}</p>
        </div>
      </div>

      {/* Shortcut Lokasi & Lemari Rak (Posisi di Atas agar Ter-highlight) */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-blue-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-blue-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Visual Lokasi
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Akses Lemari & Lokasi
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-blue-200/90 mt-1">
              Pilih lokasi untuk melihat visual denah rak lemari dan cek posisi barang secara langsung.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-300 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800 self-start sm:self-auto">
            {locations.length} Lokasi Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Link
              key={loc}
              href={`/location/${loc.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white/10 hover:bg-white/15 active:scale-[0.99] border border-white/15 hover:border-white/30 rounded-xl p-5 transition-all group backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner shrink-0 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-100 truncate">
                      {loc}
                    </h3>
                    <svg className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-blue-200/80 mt-0.5 truncate">Buka visual lemari rak di lokasi ini</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Daftar Inventaris (Sekarang di Bawah Lokasi) */}
      <DashboardORingList initialItems={serializedItems} />

      {/* Kategori Lainnya jika ada selain O-Ring */}
      {categories.filter((c) => c.toLowerCase() !== 'o-ring').length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Kategori Lainnya</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {categories
              .filter((c) => c.toLowerCase() !== 'o-ring')
              .map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${cat.toLowerCase()}`}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-blue-300 transition-all group"
                >
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 text-sm">{cat}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Lihat barang kategori ini</p>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
