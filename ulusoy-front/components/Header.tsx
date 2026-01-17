'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { Menu, User, Phone } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed w-full bg-indigo-950/20 backdrop-blur-md border-b border-white/5 text-white top-0 z-50 transition-all">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
            <div className="relative w-40 h-12">
                <NextImage 
                    src="/logo.svg" 
                    alt="Ulusoy Turizm" 
                    fill 
                    className="object-contain brightness-0 invert" // Make it white for dark header
                    priority
                />
            </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-blue-300 transition-colors">Ana Sayfa</Link>
          <Link href="/seferler" className="hover:text-blue-300 transition-colors">Seferler</Link>
          <Link href="/pnr-sorgula" className="hover:text-blue-300 transition-colors">PNR Sorgula</Link>
          <Link href="/yolcum-nerede" className="hover:text-blue-300 transition-colors">Yolcum Nerede</Link>
          <Link href="#" className="hover:text-blue-300 transition-colors">Bilet Satış Noktaları</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-semibold">
                <Phone size={16} />
                <span>0850 123 45 67</span>
            </button>
            <button className="flex items-center gap-2 bg-varan-primary hover:bg-blue-600 px-4 py-2 rounded-full transition-all text-sm font-semibold shadow-md border border-white/10">
                <User size={16} />
                <span>Giriş Yap</span>
            </button>
            <button className="md:hidden p-2">
                <Menu size={24} />
            </button>
        </div>
      </div>
    </header>
  );
}