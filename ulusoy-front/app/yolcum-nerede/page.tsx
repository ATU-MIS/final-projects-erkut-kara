'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Bus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Dynamically import Leaflet map to avoid SSR issues
const Map = dynamic(
  () => import('@/components/TrackingMap'), // We will create this component
  { 
    loading: () => <div className="h-[500px] w-full bg-slate-100 flex items-center justify-center text-slate-400">Harita Yükleniyor...</div>,
    ssr: false 
  }
);

export default function YolcumNeredePage() {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  
  const [stations, setStations] = useState<{ label: string; value: string }[]>([]);
  const [destinations, setDestinations] = useState<{ label: string; value: string }[]>([]);
  const [routeList, setRouteList] = useState<{ label: string; value: string }[]>([]);

  // Fetch Stations
  useEffect(() => {
    api.get('/stations').then(({ data }) => setStations(data.map((s: any) => ({ label: s.name, value: s.name }))));
  }, []);

  // Fetch Destinations
  useEffect(() => {
    if (!fromCity) {
        setDestinations([]);
        return;
    }
    api.get('/routes/destinations', { params: { fromCity } })
       .then(({ data }) => setDestinations(data.map((s: string) => ({ label: s, value: s }))));
  }, [fromCity]);

  // Fetch Routes for Combo
  useEffect(() => {
      if (!fromCity || !toCity) {
          setRouteList([]);
          return;
      }
      api.get('/tracking/search', { params: { from: fromCity, to: toCity } })
         .then(({ data }) => setRouteList(data.map((r: any) => ({ label: r.label, value: r.id }))));
  }, [fromCity, toCity]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-300 to-slate-400 animate-gradient-x py-12 pt-24 relative">
      {/* Header Background Fix for this page */}
      <div className="fixed top-0 left-0 w-full h-20 bg-indigo-950 z-40" />

      <div className="container mx-auto px-4 max-w-6xl relative z-50">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">Yolcum Nerede?</h1>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1">Kalkış Yeri</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10">
                            <MapPin size={20} />
                        </div>
                        <Combobox 
                            items={stations} 
                            value={fromCity} 
                            setValue={setFromCity} 
                            placeholder="Nereden" 
                            className="pl-12 h-12 w-full bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-blue-500 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1">Varış Yeri</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10">
                            <MapPin size={20} />
                        </div>
                        <Combobox 
                            items={destinations} 
                            value={toCity} 
                            setValue={setToCity} 
                            placeholder="Nereye" 
                            className="pl-12 h-12 w-full bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-blue-500 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1">Sefer</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10">
                            <Bus size={20} />
                        </div>
                        <Combobox 
                            items={routeList} 
                            value={selectedRouteId} 
                            setValue={setSelectedRouteId} 
                            placeholder="Sefer Seçiniz..." 
                            className="pl-12 h-12 w-full bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-blue-500 rounded-xl"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Map Area */}
        {selectedRouteId && (
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl relative z-0">
                <CardContent className="p-0 h-[500px] relative">
                    <Map routeId={selectedRouteId} />
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}