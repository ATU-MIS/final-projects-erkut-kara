import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ulusoy Turizm | Online Otobüs Bileti",
  description: "En ucuz otobüs bileti fiyatları için hemen tıklayın ve sitemizi ziyaret edin!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-grow bg-slate-50">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
