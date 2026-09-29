import Link from 'next/link';
import ScanForm from '@/components/ScanForm';

export const dynamic = 'force-dynamic';

export default async function ScanPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const locationSlug = decodeURIComponent(location);
  const locationName = locationSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href={`/location/${locationSlug}`} className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">← Kembali ke {locationName}</Link>
        <h1 className="text-2xl font-bold text-blue-900">Scan - {locationName}</h1>
        <p className="text-gray-500 mt-1">Isi form di bawah untuk log keluar/masuk barang</p>
      </div>

      <ScanForm location={locationName} />
    </div>
  );
}
