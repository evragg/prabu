'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { QRCodeSVG } from 'qrcode.react';

interface ItemCardProps {
  serialNumber: string;
  name: string;
  location: string;
  rack: string;
  status: string;
}

export default function ItemCard({ serialNumber, name, location, rack, status }: ItemCardProps) {
  const [showQR, setShowQR] = useState(false);

  const locationSlug = location.toLowerCase().replace(/\s+/g, '-');
  const action = status === 'available' ? 'checkout' : 'return';
  
  // Calculate URL only on client side
  const qrUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/scan/${locationSlug}?serial=${serialNumber}&action=${action}`
    : '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5 hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">{serialNumber}</h3>
          <p className="text-sm text-gray-600 mt-1">{name}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="mt-4 flex flex-wrap items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {rack}
          </div>
        </div>
        <button 
          onClick={() => setShowQR(!showQR)}
          className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded hover:bg-blue-100 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQR ? 'Tutup QR' : 'QR Item'}
        </button>
      </div>

      {showQR && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center animate-fade-in">
          <div className="p-2 bg-white border-2 border-blue-200 rounded-lg">
            <QRCodeSVG value={qrUrl} size={150} level="H" />
          </div>
        </div>
      )}
    </div>
  );
}
