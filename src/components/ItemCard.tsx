'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';
import ContactAdminModal from './ContactAdminModal';

interface ItemCardProps {
  serialNumber: string;
  name: string;
  location: string;
  rack: string;
  status: string;
  quantity?: number;
}

export default function ItemCard({ serialNumber, name, location, rack, status, quantity }: ItemCardProps) {
  const [role, setRole] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      setRole(roleCookie.split('=')[1]);
    }
  }, []);

  const locationSlug = location.toLowerCase().replace(/\s+/g, '-');
  const stock = quantity ?? 1;
  const isAvailable = status === 'available' && stock > 0;

  const handleTakeItem = () => {
    if (role === 'admin') {
      window.location.href = `/scan/${locationSlug}?serial=${serialNumber}&action=checkout`;
    } else {
      setModalOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {serialNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                Sisa: {stock} pcs
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">{name}</h3>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{location}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-semibold text-slate-700">{rack}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100">
        {isAvailable ? (
          <button
            onClick={handleTakeItem}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Ambil Barang</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed"
          >
            Stok Habis (0 pcs)
          </button>
        )}
      </div>

      <ContactAdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={{
          serialNumber,
          name,
          location,
          rack,
          quantity: stock,
        }}
      />
    </div>
  );
}
