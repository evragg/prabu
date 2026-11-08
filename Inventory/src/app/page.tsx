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

      {/* Daftar Inventaris (Pilihan yang rapi di Dashboard) */}
      <DashboardORingList initialItems={serializedItems} />

      {/* Shortcut Lokasi & Lemari Rak */}
      <div>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Akses Lemari & Lokasi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Link
              key={loc}
              href={`/location/${loc.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-700">{loc}</h3>
                  <p className="text-sm text-gray-500">Buka visual lemari rak di lokasi ini</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

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
