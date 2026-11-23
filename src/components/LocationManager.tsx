'use client';

import { useState, useEffect } from 'react';

interface Location {
  id: string;
  name: string;
  createdAt?: string;
}

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch {
      setError('Gagal memuat daftar lokasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah lokasi');
      setNewName('');
      setSuccess(`Lokasi "${data.name}" berhasil ditambahkan!`);
      await fetchLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus lokasi "${name}"? Barang yang ada di lokasi ini tidak akan terhapus, hanya label lokasinya yang dihapus.`)) return;
    setDeleting(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus lokasi');
      setSuccess(`Lokasi "${name}" berhasil dihapus.`);
      await fetchLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-blue-900">Manajemen Lokasi Dinamis</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tambah atau hapus lokasi gudang. Lokasi yang ditambah di sini akan muncul di menu Lokasi dan form tambah barang.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Tambah Lokasi Baru</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contoh: Warehouse B, Lab 2, Office 3..."
            required
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Menambah...' : '+ Tambah'}
          </button>
        </div>
      </form>

      {/* Location List */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">
          Daftar Lokasi <span className="text-slate-400 font-mono ml-1">({locations.length})</span>
        </h3>
        {locations.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Belum ada lokasi kustom.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">{loc.name}</span>
                    {loc.createdAt && (
                      <span className="block text-xs text-slate-400">
                        Ditambah: {new Date(loc.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(loc.id, loc.name)}
                  disabled={deleting === loc.id}
                  className="px-3 py-1 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                >
                  {deleting === loc.id ? 'Menghapus...' : 'Hapus'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
