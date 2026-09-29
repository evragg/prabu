import Link from 'next/link';
import { getStats, getCategories, getLocations } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getStats();
  const categories = await getCategories();
  const locations = await getLocations();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Dashboard Inventory</h1>
        <p className="text-gray-500 mt-1">Sistem pengelolaan inventaris O-Ring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5">
          <p className="text-sm text-gray-500">Lokasi</p>
          <p className="text-3xl font-bold text-blue-600">{stats.locations}</p>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Kategori</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/category/${cat.toLowerCase()}`}
              className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-700">{cat}</h3>
                  <p className="text-sm text-gray-500">Klik untuk lihat detail</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Lokasi</h2>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-700">{loc}</h3>
                  <p className="text-sm text-gray-500">Lihat barang di lokasi ini</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
