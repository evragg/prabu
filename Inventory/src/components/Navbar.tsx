'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Basic cookie parsing
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
    if (roleCookie) {
      setRole(roleCookie.split('=')[1]);
    } else {
      setRole(null);
    }
  }, [pathname]); // Re-check when route changes

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setRole(null);
    router.push('/login');
    router.refresh();
  };

  const links = [
    { href: '/', label: 'Dashboard', show: true },
    { href: '/category/o-ring', label: 'O-Ring', show: true },
    { href: '/location/module-room', label: 'Module Room', show: true },
    { href: '/logs', label: 'Log Activity', show: true },
    { href: '/admin', label: 'Admin (Kelola Barang)', show: role === 'admin' },
  ];

  if (pathname === '/login') return null; // Sembunyikan navbar di halaman login

  return (
    <nav className="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xl font-bold tracking-tight">Inventory System</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 items-center">
            {links.filter(l => l.show).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-900 text-white shadow-inner font-semibold'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {role && (
              <div className="flex items-center ml-3 pl-3 border-l border-blue-700 space-x-2">
                <span className="text-xs bg-blue-900/80 text-blue-200 px-2 py-1 rounded font-mono uppercase">
                  {role}
                </span>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-1.5 border border-blue-400/60 rounded-lg text-xs font-semibold text-blue-100 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button (Garis Tiga) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label="Buka Menu Navigasi"
            >
              {isMobileMenuOpen ? (
                // Ikon Silang (Close / X)
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Ikon Garis Tiga (Hamburger Menu)
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-900/95 border-t border-blue-700 shadow-2xl backdrop-blur-sm" id="mobile-menu">
          <div className="px-3 pt-3 pb-4 space-y-1.5">
            {links.filter(l => l.show).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-blue-700 text-white font-bold pl-5 border-l-4 border-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {role && (
              <div className="pt-3 mt-3 border-t border-blue-800/80 flex items-center justify-between px-4">
                <span className="text-xs text-blue-200">
                  Login sebagai: <strong className="text-white font-mono uppercase bg-blue-950 px-2 py-0.5 rounded">{role}</strong>
                </span>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

