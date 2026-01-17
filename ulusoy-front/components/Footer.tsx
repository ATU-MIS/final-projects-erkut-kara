'use client';

export default function Footer() {
  return (
    <footer className="bg-varan-header text-white py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">ULUSOY</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Türkiye'nin her yerine güvenli ve konforlu yolculuk.
            7/24 Müşteri Hizmetleri ile yanınızdayız.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-4">Kurumsal</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><a href="#" className="hover:text-white">Hakkımızda</a></li>
            <li><a href="#" className="hover:text-white">Kariyer</a></li>
            <li><a href="#" className="hover:text-white">Filomuz</a></li>
            <li><a href="#" className="hover:text-white">Basın Odası</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Yolcu Hizmetleri</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><a href="#" className="hover:text-white">Seferlerimiz</a></li>
            <li><a href="#" className="hover:text-white">Bilet İptal/İade</a></li>
            <li><a href="#" className="hover:text-white">Yolcum Nerede</a></li>
            <li><a href="#" className="hover:text-white">Mobil Uygulama</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">İletişim</h4>
          <p className="text-sm text-slate-300 mb-2">Genel Merkez: İstanbul</p>
          <p className="text-xl font-bold text-white">0850 123 45 67</p>
          <div className="mt-4 flex gap-4">
            {/* Social Icons Placeholder */}
            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-xs text-slate-400">
        &copy; 2025 Ulusoy Turizm. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
