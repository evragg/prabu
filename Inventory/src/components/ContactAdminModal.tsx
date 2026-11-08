'use client';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    serialNumber: string;
    name: string;
    rack?: string;
    location?: string;
    category?: string;
    quantity?: number;
  } | null;
}

export default function ContactAdminModal({ isOpen, onClose, item }: ContactAdminModalProps) {
  if (!isOpen || !item) return null;

  const stock = item.quantity ?? 1;
  const phoneNumber = '6287823175874';
  const displayPhone = '+62 878-2317-5874';
  const messageText = `Halo Admin, saya ingin konfirmasi / mengambil barang berikut:\n- Plat Number: ${item.serialNumber}\n- Nama Barang: ${item.name}\n- Posisi: ${item.rack || item.location || '-'}\nMohon bantuannya, terima kasih.`;
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header E-Commerce Style */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-center text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-sm font-bold transition-colors"
            aria-label="Tutup"
          >
            ✕
          </button>
          <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/25 text-amber-50 mb-1.5">
            Akses Pengambilan Terbatas
          </span>
          <h3 className="text-2xl font-black tracking-tight">Hubungi Admin</h3>
          <p className="text-amber-100 text-xs mt-1">
            Pengambilan barang fisik memerlukan verifikasi Admin
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Item Preview Card (E-Commerce style product summary) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <span className="font-mono text-xs font-black text-blue-800">
                  {item.serialNumber.slice(0, 4)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {item.category || 'O-Ring'}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Plat: <strong className="text-blue-900">{item.serialNumber}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Posisi Lemari / Laci:</span>
                <span className="font-bold text-slate-800">{item.rack || 'Module Room'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Stok Tersedia:</span>
                <span className="font-bold text-emerald-700">{stock} pcs</span>
              </div>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs text-amber-950 leading-relaxed">
                <p className="font-bold mb-0.5">Ingin mengambil barang ini?</p>
                <p className="text-amber-900">
                  Silakan hubungi WhatsApp Admin bertugas di <strong className="font-mono text-emerald-800 font-bold">{displayPhone}</strong> untuk dibantu proses pengambilan fisik dari laci lemari.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 space-y-2.5">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.99]"
          >
            <svg className="w-5 h-5 fill-current shrink-0 text-white" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Hubungi via WhatsApp Admin</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
