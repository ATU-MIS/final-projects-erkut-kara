'use client';

import SearchWidget from '@/components/SearchWidget';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[850px] w-full bg-slate-900 overflow-hidden">
        {/* Background Image - Placeholder for now */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80 z-10" />
        <div className="absolute inset-0 z-0">
            {/* You can replace this with a real hero image */}
            <div className="w-full h-full bg-[url('/bg.jpg')] bg-cover bg-[center_125%] opacity-80"></div> 
        </div>

        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-start relative z-20 text-left text-white pb-32 pl-4 md:pl-8">
          {/* Decorative Line */}
          <div className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 h-48 w-0.5 bg-white/30 rounded-full hidden md:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight drop-shadow-2xl max-w-4xl leading-tight">
            Yolculuğun En Konforlu Haliyle <br className="hidden md:block" /> Yeni Keşiflere!
          </h1>
          <div className="pl-4 border-l-4 border-blue-500 max-w-2xl">
            <p className="text-base md:text-lg text-slate-200 leading-relaxed font-light drop-shadow-md">
                “Geçmişten Gelen Güvenle” sloganımızla rahat, konforlu ve keyif veren bir yolculuk sunmak, en iyi hizmeti vermek için her gün “bir adım daha ötesi” diyerek yola çıkıyoruz…
            </p>
          </div>
        </div>
      </section>

      {/* Search Widget Container */}
      <div className="container mx-auto px-4 relative z-30 mb-20 -mt-24">
        <SearchWidget />
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">Neden Ulusoy?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-slate-50 rounded-2xl text-center hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🛡️</div>
                    <h3 className="text-xl font-bold mb-2">Güvenli Seyahat</h3>
                    <p className="text-slate-600">En son teknolojiyle donatılmış otobüslerimiz ve deneyimli kaptanlarımızla güvenliğiniz önceliğimizdir.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl text-center hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📺</div>
                    <h3 className="text-xl font-bold mb-2">Eğlence & Konfor</h3>
                    <p className="text-slate-600">Geniş koltuk aralıkları, kişisel eğlence sistemleri ve sınırsız internet ile yolculuğun keyfini çıkarın.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl text-center hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🥪</div>
                    <h3 className="text-xl font-bold mb-2">İkramlar</h3>
                    <p className="text-slate-600">Yolculuğunuz boyunca taze ve lezzetli ikramlarımızla hizmetinizdeyiz.</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
