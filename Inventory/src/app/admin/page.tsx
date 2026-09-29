'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  location: string;
  rack: string;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    category: 'O-Ring',
    location: 'Module Room',
    rack: 'Rak 1',
    status: 'available'
  });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: 'Menambahkan barang...', type: 'info' });
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setMsg({ text: 'Barang berhasil ditambahkan!', type: 'success' });
        setFormData({ ...formData, serialNumber: '', name: '' }); // Reset text fields
        fetchItems();
        router.refresh();
      } else {
        const errorData = await res.json();
        setMsg({ text: errorData.error || 'Gagal menambahkan barang', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Terjadi kesalahan sistem', type: 'error' });
    }
  };

  const handleDelete = async (serialNumber: string) => {
    if (!confirm(`Yakin ingin menghapus barang dengan Serial Number ${serialNumber}?`)) return;
    
    try {
      const res = await fetch(`/api/items/${serialNumber}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
        router.refresh();
      } else {
        alert('Gagal menghapus barang');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Kelola data inventory (Tambah & Hapus Barang)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Barang */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 h-fit">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Tambah Barang Baru</h2>
          
          {msg.text && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
              msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              msg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="Module Room">Module Room</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rak</label>
                <input
                  type="text"
                  name="rack"
                  value={formData.rack}
                  onChange={handleChange}
                  placeholder="Contoh: Rak - A1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Awal</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option value="available">Available</option>
                <option value="checked_out">Checked Out (None)</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-2">
              Tambah Barang
            </button>
          </form>
        </div>

        {/* Daftar Barang */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex justify-between items-center">
            Daftar Barang
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{items.length} total</span>
          </h2>
          
          {loading ? (
            <p className="text-gray-500 text-center py-8">Memuat data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    <th className="px-4 py-3">SN / Nama</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.serialNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-blue-900">{item.serialNumber}</div>
                        <div className="text-sm text-gray-500">{item.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.location} - {item.rack}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'available' ? 'Available' : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleDelete(item.serialNumber)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md text-sm transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
