'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  location: string;
  baseUrl?: string;
}

export default function QRCodeDisplay({ location, baseUrl = '' }: QRCodeDisplayProps) {
  const slug = location.toLowerCase().replace(/\s+/g, '-');
  const url = `${baseUrl}/scan/${slug}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 text-center">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">QR Code - {location}</h3>
      <p className="text-sm text-gray-500 mb-6">Scan QR code ini di pintu {location} untuk log keluar/masuk barang</p>
      <div className="inline-block p-4 bg-white border-2 border-blue-200 rounded-xl">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#1e40af"
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-xs text-gray-400 mt-4 break-all">{url}</p>
    </div>
  );
}
