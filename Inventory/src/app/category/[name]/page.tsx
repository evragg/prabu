import Link from 'next/link';
import { getItems } from '@/lib/db';
import ItemCard from '@/components/ItemCard';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);
  const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  const items = await getItems(categoryName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">← Kembali ke Dashboard</Link>
          <h1 className="text-3xl font-bold text-blue-900">{displayName}</h1>
          <p className="text-gray-500 mt-1">{items.length} item ditemukan</p>
        </div>
      </div>

      {/* Summary */}
      <div className="flex space-x-4">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
          <span className="font-semibold text-green-700">{items.filter(i => i.status === 'available').length}</span>
          <span className="text-green-600"> Available</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
          <span className="font-semibold text-red-700">{items.filter(i => i.status === 'checked_out').length}</span>
          <span className="text-red-600"> None</span>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            serialNumber={item.serialNumber}
            name={item.name}
            location={item.location}
            rack={item.rack}
            status={item.status}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Tidak ada item dalam kategori ini</p>
        </div>
      )}
    </div>
  );
}
