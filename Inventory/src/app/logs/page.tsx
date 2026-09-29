import Link from 'next/link';
import { getLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const logs = await getLogs();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">← Kembali ke Dashboard</Link>
        <h1 className="text-3xl font-bold text-blue-900">Log Activity</h1>
        <p className="text-gray-500 mt-1">Riwayat keluar-masuk barang</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-blue-800 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-3 text-xs font-semibold text-blue-800 uppercase tracking-wider">Petugas</th>
                <th className="px-6 py-3 text-xs font-semibold text-blue-800 uppercase tracking-wider">Aksi</th>
                <th className="px-6 py-3 text-xs font-semibold text-blue-800 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-xs font-semibold text-blue-800 uppercase tracking-wider">Barang</th>
                <th className="px-6 py-3 text-xs font-semibold text-blue-800 uppercase tracking-wider">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.person}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      log.action === 'checkout' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {log.action === 'checkout' ? 'Ambil' : 'Kembali'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-700">{log.serialNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.itemName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Belum ada log activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
