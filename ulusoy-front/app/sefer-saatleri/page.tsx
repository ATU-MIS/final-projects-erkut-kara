"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { StationCombobox } from "@/components/ui/combobox";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import Link from "next/link";

const fetchUpcomingRoutes = async (from?: string, to?: string) => {
  const { data } = await api.get("/routes/upcoming", {
    params: { fromCity: from, toCity: to, days: 30 } // Show next 30 days
  });
  return data;
};

export default function SeferSaatleriPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  
  const { data: routes, isLoading, refetch } = useQuery({
    queryKey: ["upcomingRoutes", from, to],
    queryFn: () => fetchUpcomingRoutes(from, to),
    enabled: true // Fetch initially
  });

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Sefer Saatleri</h1>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Kalkış</label>
                <StationCombobox value={from} onChange={setFrom} placeholder="Tümü" />
            </div>
            <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Varış</label>
                <StationCombobox value={to} onChange={setTo} placeholder="Tümü" />
            </div>
            <Button size="lg" onClick={() => refetch()} className="bg-brand-600 hover:bg-brand-700 h-14 px-8 font-bold">
                <Search className="mr-2" size={20} /> Listele
            </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-bold text-slate-700">Tarih</TableHead>
                        <TableHead className="font-bold text-slate-700">Saat</TableHead>
                        <TableHead className="font-bold text-slate-700">Güzergah</TableHead>
                        <TableHead className="font-bold text-slate-700">Otobüs Tipi</TableHead>
                        <TableHead className="font-bold text-slate-700">Fiyat</TableHead>
                        <TableHead className="text-right font-bold text-slate-700"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">Yükleniyor...</TableCell>
                        </TableRow>
                    ) : routes?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">Sefer bulunamadı.</TableCell>
                        </TableRow>
                    ) : (
                        routes?.map((route: any) => (
                            <TableRow key={route.id}>
                                <TableCell className="font-medium">
                                    {new Date(route.departureTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </TableCell>
                                <TableCell className="font-bold text-lg">
                                    {new Date(route.departureTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span>{route.fromCity}</span>
                                        <span className="text-slate-400">→</span>
                                        <span>{route.toCity}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">{route.stations.length} Durak</p>
                                </TableCell>
                                <TableCell>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                        {route.bus.layoutType === 'LAYOUT_2_1' ? '2+1 RAHAT' : '2+2 STANDART'}
                                    </span>
                                </TableCell>
                                <TableCell className="font-bold text-brand-600">{route.price} TL</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/seferler?from=${route.fromCity}&to=${route.toCity}&date=${new Date(route.departureTime).toISOString().split('T')[0]}`}>
                                        <Button size="sm" variant="outline" className="hover:text-brand-600 hover:border-brand-600">Bilet Al</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
