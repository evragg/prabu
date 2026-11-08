'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Item {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  status: string;
  quantity: number;
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
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const locationSlug = location.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    fetch(`/api/items?location=${locationSlug}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to fetch items:', err));
  }, [locationSlug]);

  // Filter items based on action
  const filteredItems = items.filter(item => {
    if (action === 'checkout') return item.quantity > 0 && item.status === 'available';
    if (action === 'return') {
      // O-Ring bersifat habis pakai, tidak dapat dikembalikan
      if (item.category.toLowerCase() === 'o-ring') return false;
      return item.status === 'checked_out';
    }
    return true;
  });

  // Selected item details
  const selectedItem = items.find(
    (i) => i.serialNumber.toLowerCase() === selectedSerial.toLowerCase()
  );

  // Max quantity available for checkout
  const maxAvailable = selectedItem ? (selectedItem.quantity || 0) : 0;

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
          quantity,
          action,
          person,
          location: location
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      const result = await res.json();

      setSuccess(true);
      setSuccessMsg(
        action === 'checkout'
          ? `Berhasil mengambil ${quantity} pcs ${selectedItem?.name || selectedSerial}! (sisa: ${result.remainingStock} pcs)`
          : `Berhasil mengembalikan ${quantity} pcs ${selectedItem?.name || selectedSerial}!`
      );
      setPerson('');
      setSelectedSerial('');
      setQuantity(1);

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

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          {successMsg || 'Berhasil! Data telah terupdate.'}
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
            onClick={() => { setAction('checkout'); setSelectedSerial(''); setQuantity(1); }}
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
            onClick={() => { setAction('return'); setSelectedSerial(''); setQuantity(1); }}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Barang</label>
        <select
          value={selectedSerial}
          onChange={(e) => {
            setSelectedSerial(e.target.value);
            setQuantity(1);
          }}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
        >
          <option value="">-- Pilih Barang --</option>
          {filteredItems.map((item) => (
            <option key={item.serialNumber} value={item.serialNumber}>
              {item.serialNumber} - {item.name} (Stok: {item.quantity} pcs)
            </option>
          ))}
        </select>
        {filteredItems.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {action === 'checkout' ? 'Tidak ada barang yang tersedia untuk diambil' : 'Tidak ada barang yang perlu dikembalikan'}
          </p>
        )}
      </div>

      {/* Quantity Selector - for checkout */}
      {action === 'checkout' && selectedItem && (
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-blue-950">
                Jumlah yang Diambil
              </label>
              <p className="text-xs text-slate-500">
                Pilih berapa pcs yang ingin Anda ambil
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-200 text-blue-900">
              Tersedia: {maxAvailable} pcs
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-lg disabled:opacity-40 transition-colors shadow-sm"
            >
              -
            </button>

            <input
              type="number"
              min={1}
              max={maxAvailable}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.min(maxAvailable, Math.max(1, val)));
              }}
              className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-center text-lg text-blue-900 shadow-sm"
            />

            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
              disabled={quantity >= maxAvailable}
              className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-lg disabled:opacity-40 transition-colors shadow-sm"
            >
              +
            </button>

            {maxAvailable > 1 && (
              <button
                type="button"
                onClick={() => setQuantity(maxAvailable)}
                className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                Ambil Semua ({maxAvailable} pcs)
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-blue-200/60 text-xs text-blue-900">
            <div className="flex justify-between items-center">
              <span>
                <span className="font-semibold">{selectedItem.name}</span> ({selectedItem.serialNumber})
              </span>
              <span className="font-bold text-base text-blue-800">
                {quantity} pcs
              </span>
            </div>
            <div className="text-slate-500 mt-1">
              Sisa stok setelah diambil: <span className="font-bold text-slate-700">{maxAvailable - quantity} pcs</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
          {currentTime}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !person || !selectedSerial}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading
          ? 'Memproses...'
          : action === 'checkout'
          ? `Ambil ${quantity} Barang`
          : 'Kembalikan Barang'}
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
