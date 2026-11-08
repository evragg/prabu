'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    document.cookie = 'user_role=viewer; path=/; max-age=86400';
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* LEFT SIDE - Penjelasan */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 lg:py-0 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white rounded-full" />
          <div className="absolute bottom-20 -right-16 w-56 h-56 bg-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rounded-full" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5">
              <img src="/slb-logo.png" alt="SLB Logo" className="h-10 w-auto object-contain brightness-0 invert" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">SLB</h2>
              <p className="text-blue-200 text-xs tracking-widest uppercase">Inventory System</p>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-6">
            Sistem Inventaris
            <br />
            <span className="text-blue-300">Digital Terpadu</span>
          </h1>

          <p className="text-blue-100 text-base leading-relaxed mb-10">
            Platform manajemen inventaris untuk pengelolaan aset dan peralatan secara real-time dengan pelacakan lokasi yang akurat.
          </p>

          {/* Features */}
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Manajemen Stok</h3>
                <p className="text-blue-200 text-sm mt-0.5">Kelola O-Ring, peralatan Lab, dan Module Room dalam satu sistem terpusat.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Pelacakan Lokasi</h3>
                <p className="text-blue-200 text-sm mt-0.5">Visualisasi lemari dan rak dengan status ketersediaan real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Riwayat Aktivitas</h3>
                <p className="text-blue-200 text-sm mt-0.5">Catat setiap pengambilan dan pengembalian barang secara otomatis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center px-8 sm:px-12 lg:px-16 py-12 lg:py-0 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl mb-4 shadow-sm">
              <img src="/slb-logo.png" alt="SLB Logo" className="h-9 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Login Admin</h1>
            <p className="text-slate-500 mt-1.5 text-sm">Masuk untuk mengelola inventaris</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-50 text-slate-400">atau</span>
            </div>
          </div>

          {/* Continue without login */}
          <button
            onClick={handleContinueWithoutLogin}
            className="w-full py-2.5 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Lanjutkan tanpa login
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            Mode hanya lihat — tidak dapat mengubah data inventaris
          </p>
        </div>
      </div>
    </div>
  );
}
