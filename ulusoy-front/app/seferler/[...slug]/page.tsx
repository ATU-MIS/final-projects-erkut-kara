'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import RouteCard from '@/components/RouteCard';
import { format, addDays, subDays, isBefore, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import SearchWidget from '@/components/SearchWidget';
import { useRouter } from 'next/navigation';

// Helper to match slug to station name
const slugify = (text: string) => {
    const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's',
        'ü': 'u', 'Ü': 'u', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o'
    };
    return text
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const DateSlider = ({ currentDate, onDateSelect }: { currentDate: Date, onDateSelect: (date: Date) => void }) => {
    const today = startOfDay(new Date());
    const dates = [];
    
    // Generate dates: 3 days before (if not past today) and 3 days after
    for (let i = -3; i <= 3; i++) {
        const d = addDays(currentDate, i);
        if (!isBefore(d, today)) {
            dates.push(d);
        }
    }

    return (
        <div className="flex items-center justify-center gap-2 py-4 bg-white/5 backdrop-blur-sm rounded-xl mt-4 overflow-x-auto no-scrollbar">
            {dates.map((date) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
                return (
                    <button
                        key={date.toISOString()}
                        onClick={() => onDateSelect(date)}
                        className={`
                            flex flex-col items-center justify-center min-w-[100px] p-2 rounded-lg transition-all border
                            ${isSelected 
                                ? 'bg-white text-blue-900 border-white shadow-lg scale-105 z-10' 
                                : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/30'
                            }
                        `}
                    >
                        <span className="text-xs font-medium opacity-80">{format(date, 'd MMMM', { locale: tr })}</span>
                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-600' : ''}`}>{format(date, 'EEEE', { locale: tr })}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default function SeferlerSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  
  const fromSlug = unwrappedParams.slug[0];
  const toSlug = unwrappedParams.slug[1];
  const dateSlug = unwrappedParams.slug[2];

  const [resolvedFrom, setResolvedFrom] = useState<string | null>(null);
  const [resolvedTo, setResolvedTo] = useState<string | null>(null);
  const [openRouteId, setOpenRouteId] = useState<string | null>(null);

  const { data: stations } = useQuery({
      queryKey: ['stations-list'],
      queryFn: async () => {
          const { data } = await api.get('/stations');
          return data;
      }
  });

  useEffect(() => {
      if (stations) {
          const from = stations.find((s: any) => slugify(s.name) === fromSlug);
          const to = stations.find((s: any) => slugify(s.name) === toSlug);
          
          if (from) setResolvedFrom(from.name);
          if (to) setResolvedTo(to.name);
          
          if (!from) setResolvedFrom(fromSlug.replace(/-/g, ' '));
          if (!to) setResolvedTo(toSlug.replace(/-/g, ' '));
      }
  }, [stations, fromSlug, toSlug]);

  const dateStr = dateSlug || format(new Date(), 'yyyy-MM-dd');
  const dateObj = new Date(dateStr);

  const { data: routes, isLoading, error } = useQuery({
    queryKey: ['routes', resolvedFrom, resolvedTo, dateStr],
    queryFn: async () => {
      if (!resolvedFrom || !resolvedTo) return [];
      const { data } = await api.get('/routes/search', {
        params: { fromCity: resolvedFrom, toCity: resolvedTo, date: dateStr }
      });
      return data.data; 
    },
    enabled: !!(resolvedFrom && resolvedTo)
  });

  const handleDateChange = (newDate: Date) => {
      const newDateStr = format(newDate, 'yyyy-MM-dd');
      router.push(`/seferler/${fromSlug}/${toSlug}/${newDateStr}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Area - Adjusted for Fixed Header */}
      <div className="bg-varan-header pb-12 pt-24 shadow-md relative z-30">
        <div className="container mx-auto px-4">
            {/* Search Widget */}
            <div className="mb-4">
                {resolvedFrom && resolvedTo ? (
                    <SearchWidget 
                        initialFrom={resolvedFrom} 
                        initialTo={resolvedTo} 
                        initialDate={dateStr} 
                        compact 
                    />
                ) : (
                    <div className="h-24 flex items-center justify-center text-white/50 bg-white/5 rounded-3xl animate-pulse">
                        Arama kutusu yükleniyor...
                    </div>
                )}
            </div>

            {/* Date Slider */}
            <DateSlider currentDate={dateObj} onDateSelect={handleDateChange} />
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 mt-6 relative z-20">
        <div className="space-y-2">
            
            {/* List Header */}
            {!isLoading && routes?.length > 0 && (
                <div className="hidden md:flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 bg-[length:200%_200%] animate-gradient-x text-white/90 text-xs font-bold uppercase tracking-wider rounded-t-2xl shadow-lg relative overflow-hidden">
                    <div className="w-24 text-center pl-24 relative z-10">Saat</div>
                    <div className="w-64 pl-48 relative z-10">Güzergah</div>
                    <div className="flex-grow text-center pl-32 relative z-10">Otobüs</div>
                    <div className="w-48 text-right pr-32 relative z-10">Fiyat</div>
                    <div className="w-10 relative z-10"></div> 
                </div>
            )}

            {isLoading && (
                <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Seferler aranıyor...</p>
                </div>
            )}

            {!isLoading && !stations && (
                 <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Durak bilgileri yükleniyor...</p>
                </div>
            )}

            {!isLoading && routes?.length === 0 && (
                <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚌</div>
                    <p className="text-lg text-slate-800 font-bold mb-2">Sefer Bulunamadı</p>
                    <p className="text-slate-500">Bu güzergahta {format(dateObj, 'd MMMM yyyy', {locale: tr})} tarihinde sefer bulunmamaktadır.</p>
                </div>
            )}

            {routes?.sort((a: any, b: any) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()).map((route: any) => (
                <RouteCard 
                    key={route.id} 
                    route={route} 
                    searchFrom={resolvedFrom} 
                    searchTo={resolvedTo}
                    isOpen={openRouteId === route.id}
                    onToggle={() => setOpenRouteId(openRouteId === route.id ? null : route.id)}
                />
            ))}
        </div>
      </div>
    </div>
  );
}