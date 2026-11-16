'use client';

import { useState, useEffect } from 'react';

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt?: string;
}

export default function UserManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'viewer',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // State untuk modal edit user
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'viewer',
    password: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg({ text: `Berhasil menambahkan pengguna @${form.username}!`, type: 'success' });
        setForm({ username: '', name: '', password: '', role: 'viewer' });
        fetchUsers();
      } else {
        setMsg({ text: data.error || 'Gagal menambahkan pengguna', type: 'error' });
      }
    } catch {
      setMsg({ text: 'Terjadi kesalahan sistem', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      password: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (res.ok) {
        setEditingUser(null);
        setMsg({ text: `Pengguna @${editingUser.username} berhasil diperbarui!`, type: 'success' });
        fetchUsers();
      } else {
        alert(data.error || 'Gagal memperbarui pengguna');
      }
    } catch {
      alert('Terjadi kesalahan sistem saat memperbarui pengguna');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Yakin ingin menghapus pengguna @${user.username} (${user.name})?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setMsg({ text: `Pengguna @${user.username} berhasil dihapus!`, type: 'success' });
        fetchUsers();
      } else {
        alert(data.error || 'Gagal menghapus pengguna');
      }
    } catch {
      alert('Terjadi kesalahan sistem saat menghapus pengguna');
    }
  };

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalViewers = users.filter(u => u.role === 'viewer').length;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pengguna</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Administrator</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{totalAdmins}</p>
          <p className="text-xs text-slate-400 mt-1">Akses penuh kelola inventaris</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Viewer (Hanya Lihat)</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{totalViewers}</p>
          <p className="text-xs text-slate-400 mt-1">Hanya dapat melihat katalog & lemari</p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Grid: Form Tambah (Kiri) & Daftar Pengguna (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Pengguna */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tambah Pengguna</h2>
              <p className="text-xs text-slate-500">Buat akun admin atau viewer baru</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="misal: ahmad, teknisi1"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="misal: Ahmad Rifai"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 4 karakter"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peran / Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
              >
                <option value="viewer">Viewer (Hanya Lihat)</option>
                <option value="admin">Admin (Akses Penuh)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {form.role === 'admin'
                  ? 'Admin dapat menambah, mengedit, menghapus barang & pengguna'
                  : 'Viewer hanya dapat melihat katalog barang dan lemari'}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </form>
        </div>

        {/* Tabel Daftar Pengguna */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daftar Pengguna Aktif</h2>
              <p className="text-xs text-slate-500 mt-0.5">Kelola akses akun yang terdaftar dalam sistem</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Pengguna</th>
                  <th className="px-6 py-3.5 font-semibold">Role</th>
                  <th className="px-6 py-3.5 font-semibold">Tgl Dibuat</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                      Memuat daftar pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                      Belum ada pengguna terdaftar.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            Viewer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Pengguna</h3>
                <p className="text-xs text-slate-500 font-mono">@{editingUser.username}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="viewer">Viewer (Hanya Lihat)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Password Baru <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Isi hanya jika ingin mengganti password pengguna ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
