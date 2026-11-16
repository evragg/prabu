'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLocationActive = pathname.startsWith('/location');
  const [isLocationOpen, setIsLocationOpen] = useState(isLocationActive);
  const [isDark, setIsDark] = useState(false);
  const [dynamicLocations, setDynamicLocations] = useState<string[]>(['Module Room', 'Lab']);

  useEffect(() => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const custom = data.map((d: any) => d.name);
          setDynamicLocations((prev) => [...new Set([...prev, ...custom])]);
        }
      })
      .catch(() => {});
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  useEffect(() => {
    // Basic cookie parsing
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      setRole(roleCookie.split('=')[1]);
    } else {
      setRole(null);
    }
  }, [pathname]); // Re-check when route changes

  // Close menu when pathname changes, but keep location dropdown open if currently in /location
  useEffect(() => {
    setIsMenuOpen(false);
    if (pathname.startsWith('/location')) {
      setIsLocationOpen(true);
    }
  }, [pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setRole(null);
    setIsMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login') return null; // Sembunyikan navbar di halaman login

  return (
    <>
      <nav className="bg-blue-800 text-white shadow-md sticky top-0 z-40 border-b border-blue-900/50">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-white px-2.5 py-1 rounded-lg shadow-sm flex items-center justify-center h-8 transition-transform group-hover:scale-105">
                <img
                  src="/slb-logo.png"
                  alt="SLB Logo"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">
                Inventory System
              </span>
            </Link>

            {/* Right: Role indicator & Hamburger Menu (Tiga Garis) */}
            <div className="flex items-center space-x-3">
              {role && (
                <span className="hidden sm:inline-flex text-xs bg-blue-900/90 text-blue-200 border border-blue-700/60 px-2.5 py-1 rounded-md font-mono font-semibold uppercase tracking-wider">
                  {role}
                </span>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                type="button"
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-blue-700/50 hover:bg-blue-700 text-white border border-blue-600/60 focus:outline-none transition-all shadow-sm active:scale-95"
                aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 110 10A5 5 0 0112 7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Tombol Tiga Garis (Hamburger Button) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-blue-700/50 hover:bg-blue-700 text-white border border-blue-600/60 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all shadow-sm active:scale-95"
                aria-label="Buka Menu Navigasi"
                title="Menu Navigasi"
              >
                {/* Ikon Tiga Garis (Hamburger) */}
                <svg
                  className="h-6 w-6 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop Overlay */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex items-center justify-between border-b border-blue-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white px-2 py-0.5 rounded shadow-sm">
              <img src="/slb-logo.png" alt="SLB" className="h-4 w-auto object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight leading-tight">Navigasi Menu</h2>
              <p className="text-[11px] text-blue-200 font-medium">Inventory System</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
            aria-label="Tutup Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info Card (if logged in) */}
        {role ? (
          <div className="p-4 mx-4 mt-4 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Akun Aktif
              </span>
              <span className="font-mono font-bold text-blue-900 text-sm uppercase">
                {role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100/80 hover:bg-red-200 hover:text-red-900 rounded-lg transition-colors border border-red-200 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        ) : (
          <div className="p-4 mx-4 mt-4 rounded-xl bg-slate-50 border border-slate-200">
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login Admin</span>
            </Link>
          </div>
        )}

        {/* Links Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
            Daftar Halaman
          </span>

          {/* 1. Dashboard */}
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/'
                ? 'bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
            }`}
          >
            <span className={pathname === '/' ? 'text-white' : 'text-slate-400'}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>

          {/* 2. Location (Dropdown: Module Room & Lab) */}
          <div className="space-y-1 pt-0.5">
            <button
              type="button"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isLocationActive
                  ? 'bg-blue-50 text-blue-900 border border-blue-200/80 font-bold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isLocationActive ? 'text-blue-700' : 'text-slate-400'}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span>Location</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isLocationOpen ? 'rotate-180 text-blue-700' : 'text-slate-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sub-menu Dropdown Items */}
            {isLocationOpen && (
              <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-blue-200 ml-5 my-1 animate-fade-in max-h-60 overflow-y-auto">
                {dynamicLocations.map((loc) => {
                  const slug = loc.toLowerCase().replace(/[\s-]+/g, '-');
                  const path = `/location/${slug}`;
                  const isActive = pathname === path;
                  return (
                    <Link
                      key={loc}
                      href={path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-700 text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </span>
                      <span>{loc}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Log Activity */}
          <Link
            href="/logs"
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/logs'
                ? 'bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
            }`}
          >
            <span className={pathname === '/logs' ? 'text-white' : 'text-slate-400'}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </span>
            <span>Log Activity</span>
          </Link>

          {/* 4. Admin (Kelola Barang) */}
          {role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/admin'
                  ? 'bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
              }`}
            >
              <span className={pathname === '/admin' ? 'text-white' : 'text-slate-400'}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span>Admin (Kelola Barang)</span>
            </Link>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-center text-xs text-slate-400">
          SLB Inventory System &copy; {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}


