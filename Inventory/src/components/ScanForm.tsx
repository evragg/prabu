'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Item {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  status: string;
}

function ScanFormInner({ location }: { location: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialSerial = searchParams.get('serial') || '';
  const initialAction = searchParams.get('action') as 'checkout' | 'return' || 'checkout';

  const [items, setItems] = useState<Item[]>([]);
  const [person, setPerson] = useState('');
  const [action, setAction] = useState<'checkout' | 'return'>(initialAction);
  const [selectedSerial, setSelectedSerial] = useState(initialSerial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | null>(null);

  const locationSlug = location.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
    if (roleCookie) {
      setRole(roleCookie.split('=')[1]);
    }
  }, []);

  useEffect(() => {
    fetch(`/api/items?location=${locationSlug}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to fetch items:', err));
  }, [locationSlug]);

  const filteredItems = items.filter(item => {
    if (action === 'checkout') return item.status === 'available';
    if (action === 'return') {
      // O-Ring bersifat habis pakai, tidak dapat dikembalikan
      return item.status === 'checked_out' && item.category.toLowerCase() !== 'o-ring';
    }
    return true;
  });

  const currentTime = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: selectedSerial,
          action,
          person,
          location: location
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSuccess(true);
      setPerson('');
      setSelectedSerial('');

      // Refresh items
      const updatedItems = await fetch(`/api/items?location=${locationSlug}`).then(r => r.json());
      setItems(updatedItems);

      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 space-y-5">
      <h2 className="text-xl font-bold text-blue-900">Form Keluar/Masuk Barang</h2>
      <p className="text-sm text-gray-500">Lokasi: <span className="font-medium text-blue-700">{location}</span></p>

      {role === 'viewer' && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg text-xs font-medium">
          Mode Viewer (Hanya Melihat): Anda login sebagai viewer dan tidak memiliki izin untuk mengambil atau mengembalikan barang.
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          Berhasil! Data telah terupdate.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Petugas</label>
        <input
          type="text"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          required
          placeholder="Masukkan nama Anda"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aksi</label>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => { setAction('checkout'); setSelectedSerial(''); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border ${
              action === 'checkout'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Ambil Barang
          </button>
          <button
            type="button"
            onClick={() => { setAction('return'); setSelectedSerial(''); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border ${
              action === 'return'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Kembalikan Barang
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Barang (Serial Number)</label>
        <select
          value={selectedSerial}
          onChange={(e) => setSelectedSerial(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
        >
          <option value="">-- Pilih Barang --</option>
          {filteredItems.map((item) => (
            <option key={item.serialNumber} value={item.serialNumber}>
              {item.serialNumber} - {item.name}
            </option>
          ))}
        </select>
        {filteredItems.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {action === 'checkout' ? 'Tidak ada barang yang tersedia untuk diambil' : 'Tidak ada barang yang perlu dikembalikan'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
          {currentTime}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !person || !selectedSerial || role === 'viewer'}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {role === 'viewer' ? 'Hanya Dapat Melihat (Viewer)' : loading ? 'Memproses...' : 'Submit'}
      </button>
    </form>
  );
}

export default function ScanForm({ location }: { location: string }) {
  return (
    <Suspense fallback={<div className="p-6 bg-white rounded-xl shadow-sm border border-blue-100 text-center text-gray-500">Memuat Form...</div>}>
      <ScanFormInner location={location} />
    </Suspense>
  );
}
