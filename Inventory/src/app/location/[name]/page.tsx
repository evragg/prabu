import Link from 'next/link';
import { cookies } from 'next/headers';
import { getItemsByLocation } from '@/lib/db';
import QRCodeDisplay from '@/components/QRCodeDisplay';
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
            {role === 'viewer' 
              ? 'Klik laci pada lemari rak visual di bawah untuk mengecek isi dan status barang.'
              : 'Klik laci pada lemari rak visual di bawah untuk mengecek isi barang atau ambil/kembalikan.'}
          </p>
        </div>

        {role !== 'viewer' && (
          <Link
            href={`/scan/${locationSlug}`}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all self-start sm:self-auto flex items-center gap-2"
          >
            <span>Buka Form Keluar/Masuk</span>
          </Link>
        )}
      </div>

      {/* Main Grid: Visual Cabinet on Left, QR Code on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Visual Cabinet Section (Span 3 cols) */}
        <div className="lg:col-span-3">
          <CabinetRackView
            locationName={locationName}
            locationSlug={locationSlug}
            items={items}
          />
        </div>

        {/* QR Code and Quick Tools (1 col) */}
        <div className="space-y-6">
          <QRCodeDisplay location={locationName} />

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 p-5 rounded-xl space-y-3">
            <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <span>Petunjuk Rak Visual</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">1.</span>
                <span>
                  <strong>Klik slot laci</strong> (misal A1, B2) untuk membuka popup detail barang.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">2.</span>
                <span>
                  Gunakan <strong>Pencarian</strong> untuk menemukan slot lemari tempat barang berada.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">3.</span>
                <span>
                  Dot <span className="text-emerald-600 font-bold">Hijau</span> = Tersedia, Dot{' '}
                  <span className="text-rose-600 font-bold">Merah</span> = Sedang Dipinjam.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
