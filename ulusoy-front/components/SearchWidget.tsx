'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Calendar, ArrowRightLeft } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import api from '../utils/api';
import { Combobox } from './ui/combobox';

interface SearchWidgetProps {
    initialFrom?: string;
    initialTo?: string;
    initialDate?: string;
    compact?: boolean;
}

export default function SearchWidget({ initialFrom, initialTo, initialDate, compact }: SearchWidgetProps) {
  const router = useRouter();
  
  const [fromCity, setFromCity] = useState<string>(initialFrom || 'TRABZON');
  const [toCity, setToCity] = useState<string>(initialTo || 'ANKARA (AŞTİ)');
  const [date, setDate] = useState<string>(initialDate || format(new Date(), 'yyyy-MM-dd'));
  
  const [stations, setStations] = useState<{ label: string; value: string }[]>([]);
  const [destinations, setDestinations] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
      if(initialFrom) setFromCity(initialFrom);
      if(initialTo) setToCity(initialTo);
      if(initialDate) setDate(initialDate);
  }, [initialFrom, initialTo, initialDate]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data } = await api.get('/stations');
        setStations(data.map((s: any) => ({ label: s.name, value: s.name })));
      } catch (error) {
        console.error('Failed to fetch stations', error);
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    if (!fromCity) {
        setDestinations([]);
        return;
    }
    const fetchDestinations = async () => {
        try {
            const { data } = await api.get('/routes/destinations', {
                params: { fromCity }
            });
            setDestinations(data.map((s: string) => ({ label: s, value: s })));
        } catch (error) {
            console.error(error);
        }
    };
    fetchDestinations();
  }, [fromCity]);

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

  const handleSearch = (overrideDate?: string) => {
    const searchDate = overrideDate || date;
    if (!fromCity || !toCity || !searchDate) return;
    const url = `/seferler/${slugify(fromCity)}/${slugify(toCity)}/${searchDate}`;
    router.push(url);
  };

  const handleSwap = () => {
      const temp = fromCity;
      setFromCity(toCity);
      setToCity(temp);
  };

  const setDateToday = () => {
      const d = format(new Date(), 'yyyy-MM-dd');
      setDate(d);
      handleSearch(d);
  };

  const setDateTomorrow = () => {
      const d = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      setDate(d);
      handleSearch(d);
  };

  return (
    <div className={cn(
        "bg-white rounded-3xl shadow-2xl p-6 relative z-20 border border-white/10 backdrop-blur-xl transition-all",
        compact ? "mt-0 shadow-lg bg-slate-900/80" : "-mt-32 bg-slate-900/60" // Increased negative margin
    )}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        
        {/* From */}
        <div className="lg:col-span-3 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors z-10">
                <MapPin size={20} />
            </div>
            <Combobox 
                items={stations} 
                value={fromCity} 
                setValue={setFromCity} 
                placeholder="Nereden" 
                className="pl-12 h-14 w-full bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-slate-800 focus:border-blue-500 rounded-2xl transition-all text-base font-medium placeholder:text-slate-400"
            />
        </div>

        {/* Swap */}
        <div className="hidden lg:flex justify-center lg:col-span-1 pb-2">
            <button onClick={handleSwap} className="p-3 bg-white/5 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all border border-white/10">
                <ArrowRightLeft size={20} />
            </button>
        </div>

        {/* To */}
        <div className="lg:col-span-3 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors z-10">
                <MapPin size={20} />
            </div>
            <Combobox 
                items={destinations.length > 0 ? destinations : stations} 
                value={toCity} 
                setValue={setToCity} 
                placeholder="Nereye" 
                className="pl-12 h-14 w-full bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-slate-800 focus:border-blue-500 rounded-2xl transition-all text-base font-medium placeholder:text-slate-400"
            />
        </div>

        {/* Date (Native) */}
        <div className="lg:col-span-3 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors z-10 pointer-events-none">
                <Calendar size={20} />
            </div>
            <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full h-14 pl-12 pr-4 bg-white/5 hover:bg-white/10 focus:bg-slate-800 focus:border-blue-500 border border-white/10 rounded-2xl transition-all font-medium text-white outline-none appearance-none color-scheme-dark"
                style={{ colorScheme: 'dark' }}
            />
        </div>

        {/* Buttons Group */}
        <div className="lg:col-span-2 flex items-center gap-3 h-14">
            <div className="flex flex-col gap-2 h-full w-24 shrink-0">
                <button onClick={setDateToday} className="flex-1 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20 shadow-sm flex items-center justify-center">
                    BUGÜN
                </button>
                <button onClick={setDateTomorrow} className="flex-1 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20 shadow-sm flex items-center justify-center">
                    YARIN
                </button>
            </div>
            
            <Button 
                onClick={() => handleSearch()} 
                className="flex-grow h-full rounded-2xl text-lg font-bold bg-[#0057d9] hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-white border-none"
            >
                SEFER ARA
            </Button>
        </div>
      </div>
    </div>
  );
}
