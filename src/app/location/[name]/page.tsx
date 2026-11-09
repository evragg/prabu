import Link from 'next/link';
import { cookies } from 'next/headers';
import { getItemsByLocation } from '@/lib/db';
import CabinetRackView from '@/components/CabinetRackView';

export const dynamic = 'force-dynamic';

export default async function LocationPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  const locationSlug = decodeURIComponent(name);
  const locationName = locationSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const items = await getItemsByLocation(locationSlug);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-1 inline-flex items-center gap-1 transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight flex items-center gap-3">
            <span>{locationName}</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">
              {items.length} Item
            </span>
            {role === 'viewer' && (
              <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                Mode Viewer
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Klik laci pada lemari rak visual di bawah untuk mengecek isi barang atau ambil/kembalikan.
          </p>
        </div>

        {role !== 'admin' && (
          <a
            href="https://wa.me/6287823175874?text=Halo%20Admin,%20saya%20ingin%20mengambil%20barang%20di%20inventory"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hubungi Admin WhatsApp (+62 878-2317-5874)</span>
          </a>
        )}
      </div>

      {/* Visual Cabinet Section */}
      <div>
        <CabinetRackView
          locationName={locationName}
          locationSlug={locationSlug}
          items={items}
        />
      </div>
    </div>
  );
}
