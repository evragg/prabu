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
  quantity?: number;
}

const MODULE_ROOM_RACKS: { group: string; racks: string[] }[] = [
  { group: 'Baris A', racks: ['Rak - A1', 'Rak - A2', 'Rak - A3', 'Rak - A4'] },
  { group: 'Baris B', racks: ['Rak - B1', 'Rak - B2', 'Rak - B3', 'Rak - B4'] },
  { group: 'Baris C', racks: ['Rak - C1', 'Rak - C2', 'Rak - C3', 'Rak - C4'] },
  { group: 'Baris D', racks: ['Rak - D1', 'Rak - D2', 'Rak - D3', 'Rak - D4'] },
  { group: 'Baris E', racks: ['Rak - E1', 'Rak - E2', 'Rak - E3', 'Rak - E4'] },
  { group: 'Baris F', racks: ['Rak - F1', 'Rak - F2', 'Rak - F3', 'Rak - F4'] },
  { group: 'Baris G', racks: ['Rak - G1', 'Rak - G2', 'Rak - G3', 'Rak - G4'] },
  { group: 'Baris H', racks: ['Rak - H1', 'Rak - H2', 'Rak - H3', 'Rak - H4'] },
];

const ALL_MODULE_RACKS = MODULE_ROOM_RACKS.flatMap((g) => g.racks);

const LAB_CABINET_RACKS: { group: string; racks: string[] }[] = [
  {
    group: 'Lemari 1',
    racks: [
      'Lemari 1 - Tingkat 1',
      'Lemari 1 - Tingkat 2',
      'Lemari 1 - Tingkat 3',
      'Lemari 1 - Tingkat 4',
      'Lemari 1 - Tingkat 5',
    ],
  },
  {
    group: 'Lemari 2',
    racks: [
      'Lemari 2 - Tingkat 1',
      'Lemari 2 - Tingkat 2',
      'Lemari 2 - Tingkat 3',
      'Lemari 2 - Tingkat 4',
      'Lemari 2 - Tingkat 5',
    ],
  },
  {
    group: 'Lemari 3',
    racks: [
      'Lemari 3 - Tingkat 1',
      'Lemari 3 - Tingkat 2',
      'Lemari 3 - Tingkat 3',
      'Lemari 3 - Tingkat 4',
      'Lemari 3 - Tingkat 5',
    ],
  },
];

const ALL_LAB_RACKS = [
  ...LAB_CABINET_RACKS.flatMap((g) => g.racks),
  'Tingkat 1',
  'Tingkat 2',
  'Tingkat 3',
  'Tingkat 4',
  'Tingkat 5',
];

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    category: '',
    location: 'Module Room',
    rack: 'Rak - A1',
    status: 'available',
    quantity: 1
  });
  const [editingSerial, setEditingSerial] = useState<string | null>(null);
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
    const { name, value } = e.target;
    if (name === 'quantity') {
      setFormData({ ...formData, quantity: Math.max(0, parseInt(value) || 0) });
    } else if (name === 'location') {
      let newRack = formData.rack;
      if (value === 'Module Room' && !ALL_MODULE_RACKS.includes(formData.rack)) {
        newRack = 'Rak - A1';
      } else if (value === 'Lab' && !ALL_LAB_RACKS.includes(formData.rack)) {
        newRack = 'Lemari 1 - Tingkat 1';
      }
      setFormData({ ...formData, location: value, rack: newRack });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStartEdit = (item: Item) => {
    setEditingSerial(item.serialNumber);
    setFormData({
      serialNumber: item.serialNumber,
      name: item.name,
      category: item.category,
      location: item.location,
      rack: item.rack,
      status: item.status,
      quantity: item.quantity ?? 1,
    });
    setMsg({ text: `Mode Edit: Mengubah data barang ${item.serialNumber}`, type: 'info' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSerial(null);
    setFormData({
      serialNumber: '',
      name: '',
      category: '',
      location: 'Module Room',
      rack: 'Rak - A1',
      status: 'available',
      quantity: 1,
    });
    setMsg({ text: '', type: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSerial) {
      // Update existing item
      setMsg({ text: 'Menyimpan perubahan...', type: 'info' });
      try {
        const res = await fetch(`/api/items/${editingSerial}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setMsg({ text: `Berhasil memperbarui barang ${formData.serialNumber}!`, type: 'success' });
          handleCancelEdit();
          fetchItems();
          router.refresh();
        } else {
          const errorData = await res.json();
          setMsg({ text: errorData.error || 'Gagal memperbarui barang', type: 'error' });
        }
      } catch (err) {
        setMsg({ text: 'Terjadi kesalahan sistem', type: 'error' });
      }
    } else {
      // Add new item
      setMsg({ text: 'Menambahkan barang...', type: 'info' });
      try {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          const result = await res.json();
          const count = result.count || (result.items ? result.items.length : 1);
          setMsg({ text: `Berhasil menambahkan ${count} barang!`, type: 'success' });
          setFormData({ ...formData, serialNumber: '', name: '', category: '', quantity: 1 }); // Reset fields
          fetchItems();
          router.refresh();
        } else {
          const errorData = await res.json();
          setMsg({ text: errorData.error || 'Gagal menambahkan barang', type: 'error' });
        }
      } catch (err) {
        setMsg({ text: 'Terjadi kesalahan sistem', type: 'error' });
      }
    }
  };

  const handleDelete = async (serialNumber: string) => {
    if (!confirm(`Yakin ingin menghapus barang dengan Plat Number ${serialNumber}?`)) return;
    
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
        {/* Form Tambah / Edit Barang */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900">
              {editingSerial ? `Edit Barang: ${editingSerial}` : 'Tambah Barang Baru'}
            </h2>
            {editingSerial && (
              <button
                onClick={handleCancelEdit}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Batal ✕
              </button>
            )}
          </div>
          
          {msg.text && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
              msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              msg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plat Number *</label>
              <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-mono font-bold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Qty / Sisa Pcs) *</label>
                <input
                  type="number"
                  name="quantity"
                  min={0}
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
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
                  <option value="Lab">Lab</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rak {formData.location === 'Lab' ? '(Pilih Tingkat Lemari)' : formData.location === 'Module Room' ? '(Pilih Laci Lemari)' : ''}
                </label>
                {formData.location === 'Lab' ? (
                  <select
                    name="rack"
                    value={formData.rack}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-slate-800"
                  >
                    {LAB_CABINET_RACKS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.racks.map((rackName) => (
                          <option key={rackName} value={rackName}>
                            {rackName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {!ALL_LAB_RACKS.includes(formData.rack) && formData.rack && (
                      <option value={formData.rack}>{formData.rack} (Kustom)</option>
                    )}
                  </select>
                ) : formData.location === 'Module Room' ? (
                  <select
                    name="rack"
                    value={formData.rack}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-slate-800"
                  >
                    {MODULE_ROOM_RACKS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.racks.map((rackName) => (
                          <option key={rackName} value={rackName}>
                            {rackName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {!ALL_MODULE_RACKS.includes(formData.rack) && formData.rack && (
                      <option value={formData.rack}>{formData.rack} (Kustom)</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="rack"
                    value={formData.rack}
                    onChange={handleChange}
                    placeholder="Contoh: Rak 1 / Gudang B"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                {editingSerial ? 'Simpan Perubahan' : 'Tambah Barang'}
              </button>
              {editingSerial && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
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
                    <th className="px-4 py-3">Plat Number / Nama</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Stok (Sisa)</th>
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
                        <span className="font-mono font-bold text-blue-900 text-sm">
                          {item.quantity ?? 1} pcs
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'available' ? 'Available' : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-md text-sm font-semibold transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(item.serialNumber)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md text-sm transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
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
