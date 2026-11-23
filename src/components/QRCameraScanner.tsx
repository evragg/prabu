'use client';

import { useEffect, useRef, useState } from 'react';

interface QRCameraScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRCameraScanner({ onScan, onClose }: QRCameraScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<{ stop: () => void } | null>(null);
  const divId = 'qr-camera-scanner-region';

  useEffect(() => {
    let html5QrCode: { start: Function; stop: () => Promise<void> } | null = null;

    const startScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        setScanning(true);

        const scanner = new Html5QrcodeScanner(
          divId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            // Extract serial number from URL if scanned from QR code, or use raw text
            let serial = decodedText;
            try {
              const url = new URL(decodedText);
              const params = new URLSearchParams(url.search);
              const s = params.get('serial');
              if (s) serial = s;
            } catch {
              // Not a URL, use raw text as serial
            }
            scanner.clear().catch(() => {});
            onScan(serial.trim());
          },
          (errorMsg: string) => {
            // Silently ignore frame-level decode errors
            void errorMsg;
          }
        );

        scannerRef.current = {
          stop: () => scanner.clear().catch(() => {}),
        };
      } catch (err) {
        setError('Gagal memuat kamera. Pastikan izin kamera diaktifkan di browser.');
        setScanning(false);
        console.error('QR Scanner error:', err);
      }
    };

    startScanner();

    return () => {
      scannerRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-blue-900 text-base">Scan QR / Barcode</h3>
            <p className="text-xs text-slate-500 mt-0.5">Arahkan kamera ke QR Code atau barcode barang</p>
          </div>
          <button
            onClick={() => { scannerRef.current?.stop(); onClose(); }}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Tutup scanner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          ) : (
            <>
              {!scanning && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                </div>
              )}
              <div id={divId} className="w-full" />
            </>
          )}
        </div>

        <div className="px-5 pb-4 text-center">
          <p className="text-[11px] text-slate-400">
            Jika QR tidak terbaca, masukkan Plat Number secara manual di form
          </p>
        </div>
      </div>
    </div>
  );
}
