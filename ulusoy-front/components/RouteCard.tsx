'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BusLayout } from './bus/BusLayout';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { ChevronDown, User, Armchair, Info, Map, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Route {
    id: string;
    fromCity: string;
    toCity: string;
    departureTime: string;
    mainDepartureTime?: string;
    arrivalTime: string;
    price: number;
    duration: string;
    dateInfo?: string;
    stations: string[];
    routeStations?: { station: string, time: string }[];
    restStops?: string[];
    bus: {
        plate: string;
        model: string;
        seatCount: number;
        layoutType: "LAYOUT_2_1" | "LAYOUT_2_2";
        layout: any;
        features?: { name: string, description?: string, iconPath: string }[]; 
        specs: {
            hasWifi: boolean;
            hasTV: boolean;
            hasAC: boolean;
        } | null;
    };
}

interface RouteCardProps {
    route: Route;
    searchFrom?: string | null;
    searchTo?: string | null;
    isOpen: boolean;
    onToggle: () => void;
}

export default function RouteCard({ route, searchFrom, searchTo, isOpen, onToggle }: RouteCardProps) {
    const router = useRouter();

    const displayFrom = searchFrom || route.fromCity;
    const displayTo = searchTo || route.toCity;

    const [selectedSeats, setSelectedSeats] = useState<{ number: number; gender: "MALE" | "FEMALE" }[]>([]);
    const [showFullRoute, setShowFullRoute] = useState(false);

    const { data: availableSeatNumbers } = useQuery({
        queryKey: ["seats", route.id, displayFrom, displayTo],
        queryFn: async () => {
            const { data } = await api.get(`/tickets/available-seats/${route.id}`, {
                params: { fromCity: displayFrom, toCity: displayTo } 
            });
            return data;
        },
        enabled: isOpen
    });

    const allSeatNumbers = Array.from({ length: route.bus.seatCount }, (_, i) => i + 1);
    const occupiedSeats = allSeatNumbers
        .filter(n => availableSeatNumbers && !availableSeatNumbers.includes(n))
        .map(n => ({
            number: n,
            gender: n % 2 === 0 ? "FEMALE" : "MALE" 
        })) as { number: number; gender: "MALE" | "FEMALE" }[];

    const handleSeatSelect = (seat: { number: number; gender: "MALE" | "FEMALE" }) => {
        if (selectedSeats.length >= 5) {
            alert("En fazla 5 koltuk seçebilirsiniz.");
            return;
        }
        setSelectedSeats([...selectedSeats, seat]);
    };

    const handleSeatDeselect = (seatNumber: number) => {
        setSelectedSeats(selectedSeats.filter((s) => s.number !== seatNumber));
    };

    const handleContinue = () => {
        if (selectedSeats.length === 0) return;
        localStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
        localStorage.setItem("routeId", route.id);
        localStorage.setItem("routePrice", route.price.toString());
        localStorage.setItem("fromCity", displayFrom);
        localStorage.setItem("toCity", displayTo);
        router.push("/odeme");
    };

    const startTime = route.mainDepartureTime || route.departureTime;

    const fullStopList = route.routeStations ? 
        [{station: route.fromCity, time: startTime}, ...route.routeStations, {station: route.toCity, time: route.arrivalTime}] 
        : [{station: route.fromCity, time: startTime}, ...(route.stations?.map(s => ({station: s, time: ''})) || []), {station: route.toCity, time: route.arrivalTime}];

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md mb-4">
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-6 flex-grow">
                    
                    {/* Detail Button */}
                    <div className="flex items-center gap-4 border-r border-slate-200 pr-4">
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Sefer Detayı">
                                    <Info size={24} />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                                <div className="bg-gradient-to-r from-blue-900 via-blue-600 to-blue-900 bg-[length:200%_200%] animate-gradient-x text-white p-6 relative overflow-hidden">
                                    <DialogTitle className="text-xl font-bold relative z-10">Sefer Detayları</DialogTitle>
                                </div>
                                
                                {!showFullRoute ? (
                                    <div className="p-6 space-y-6 bg-white">
                                        {/* Locations */}
                                        <div className="space-y-4 relative">
                                            <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200" />
                                            
                                            <div className="relative pl-6">
                                                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-white" />
                                                <p className="text-xs text-slate-500 uppercase font-bold">İlk Kalkış Yeri</p>
                                                <p className="font-bold text-slate-800">{route.fromCity}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(startTime), 'dd-MM-yyyy HH:mm')}</p>
                                            </div>

                                            <div className="relative pl-6">
                                                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-4 border-blue-600 bg-white" />
                                                <p className="text-xs text-blue-600 uppercase font-bold">Kalkış Yeriniz</p>
                                                <p className="font-bold text-slate-800">{displayFrom}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(route.departureTime), 'dd-MM-yyyy HH:mm')}</p> 
                                            </div>

                                            {/* Duration Indicator */}
                                            <div className="relative pl-6 py-1">
                                                <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-auto bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 z-10 whitespace-nowrap">
                                                    {route.duration.replace('h', ' sa').replace('m', ' dk')}
                                                </div>
                                            </div>

                                            <div className="relative pl-6">
                                                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-green-500 bg-white" />
                                                <p className="text-xs text-green-600 uppercase font-bold">Varış Yeriniz</p>
                                                <p className="font-bold text-slate-800">{displayTo}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(route.arrivalTime), 'dd-MM-yyyy HH:mm')}</p>
                                            </div>
                                        </div>

                                        {/* Route Map Toggle */}
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">GÜZERGAH</p>
                                            <button 
                                                onClick={() => setShowFullRoute(true)}
                                                className="w-full flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <span className="flex items-center gap-2"><Map size={16}/> Tümünü Görmek İçin Tıklayınız</span>
                                                <ChevronDown size={16} className="-rotate-90" />
                                            </button>
                                        </div>

                                        {/* Rest Stops */}
                                        {route.restStops && route.restStops.length > 0 && (
                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">MOLALAR</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {route.restStops.map((stop, idx) => (
                                                        <span key={idx} className="bg-white border border-slate-200 px-2 py-1 rounded text-sm text-slate-700 flex items-center gap-1">
                                                            ☕ {stop}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Other Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold">SEFER TİPİ</p>
                                                <p className="font-bold text-slate-800">Express</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold">OTOBÜS</p>
                                                <p className="font-bold text-slate-800">{route.bus.plate}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">OTOBÜS ÖZELLİKLERİ</p>
                                            <div className="flex gap-3">
                                                {route.bus.features?.map((f, idx) => (
                                                    <img 
                                                        key={idx} 
                                                        src={`http://localhost:3000${f.iconPath}`} 
                                                        alt={f.name} 
                                                        title={f.description || f.name} 
                                                        className="w-7 h-7 object-contain cursor-help opacity-80 hover:opacity-100" 
                                                    />
                                                ))}
                                                
                                                {!route.bus.features?.length && (
                                                    <>
                                                    {route.bus.specs?.hasWifi && <span title="Wifi" className="text-lg">📶</span>}
                                                    {route.bus.specs?.hasTV && <span title="TV" className="text-lg">📺</span>}
                                                    {route.bus.specs?.hasAC && <span title="Klima" className="text-lg">❄️</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[500px] flex flex-col bg-white">
                                        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-20">
                                            <h3 className="font-bold text-slate-800">Sefer Güzergahı</h3>
                                            <button onClick={() => setShowFullRoute(false)} className="p-1 hover:bg-slate-100 rounded-full">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="flex-grow overflow-y-auto p-4 space-y-0">
                                            {(() => {
                                                const startIndex = fullStopList.findIndex(s => s.station === displayFrom);
                                                const endIndex = fullStopList.findIndex(s => s.station === displayTo);
                                                
                                                return fullStopList.map((stop, idx) => {
                                                    const isStart = idx === startIndex;
                                                    const isEnd = idx === endIndex;
                                                    const isActive = idx >= startIndex && idx <= endIndex;
                                                    const isPath = idx >= startIndex && idx < endIndex;

                                                    return (
                                                        <div key={idx} className="flex gap-4 relative pb-6 last:pb-0">
                                                            {idx !== fullStopList.length - 1 && (
                                                                <div className={`absolute left-[19px] top-4 bottom-0 ${isPath ? 'bg-blue-600 w-1' : 'bg-slate-200 w-0.5'}`} />
                                                            )}
                                                            
                                                            <div className="relative z-10 w-10 text-center pt-1 flex justify-center">
                                                                <div className={`w-3 h-3 rounded-full border-2 ${
                                                                    isStart ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100' :
                                                                    isEnd ? 'bg-green-500 border-green-500 ring-4 ring-green-100' :
                                                                    isActive ? 'bg-white border-blue-600' :
                                                                    'bg-white border-slate-400'
                                                                }`} />
                                                            </div>
                                                            
                                                            <div className="flex-grow pt-0">
                                                                <p className="font-bold text-sm text-slate-800">
                                                                    {stop.station}
                                                                    {isStart && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Kalkış</span>}
                                                                    {isEnd && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Varış</span>}
                                                                </p>
                                                                {stop.time && (
                                                                    <p className="text-xs text-slate-500">
                                                                        {format(new Date(stop.time), 'dd.MM.yyyy HH:mm')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex flex-col items-center mb-2">
                        <span className="text-2xl font-bold text-slate-800 leading-none">
                            {format(new Date(route.departureTime), 'HH:mm')}
                        </span>
                        <span className="text-sm font-medium text-slate-500 mt-1">{displayFrom}</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 min-w-[140px] relative">
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {route.duration.replace('h', ' sa').replace('m', ' dk')}
                        </span>
                        <div className="w-full h-[2px] bg-slate-200 relative">
                            <div className="absolute right-0 -top-1 w-2 h-2 bg-slate-300 rounded-full" />
                        </div>
                        
                        {route.dateInfo && (
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-full whitespace-nowrap border border-indigo-100 shadow-sm w-max">
                                {route.dateInfo}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-slate-800">
                            {format(new Date(route.arrivalTime), 'HH:mm')}
                        </span>
                        <span className="text-sm font-medium text-slate-500">{displayTo}</span>
                    </div>
                </div>

                {/* Features & Price */}
                <div className="flex items-center justify-between flex-grow pl-12">
                    <div className="flex gap-3 text-slate-400">
                        {route.bus.features?.map((f, idx) => (
                            <img 
                                key={idx} 
                                src={`http://localhost:3000${f.iconPath}`} 
                                alt={f.name} 
                                title={f.description || f.name} 
                                className="w-7 h-7 object-contain cursor-help opacity-80 hover:opacity-100" 
                            />
                        ))}
                        
                        {!route.bus.features?.length && (
                            <>
                            {route.bus.specs?.hasWifi && <span title="Wifi" className="text-xl">📶</span>}
                            {route.bus.specs?.hasTV && <span title="TV" className="text-xl">📺</span>}
                            {route.bus.specs?.hasAC && <span title="Klima" className="text-xl">❄️</span>}
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-slate-500">{route.price} TL</span>
                        <CollapsibleTrigger asChild>
                            <Button variant={isOpen ? "secondary" : "default"} className={isOpen ? "bg-slate-100 text-slate-700" : "bg-varan-primary hover:bg-blue-700"}>
                                {isOpen ? 'Kapat' : 'Koltuk Seç'}
                                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>
            </div>

            <CollapsibleContent className="border-t border-slate-100 bg-slate-50/50">
                <div className="p-6">
                    <div className="flex flex-col xl:flex-row gap-8 items-start">
                        <div className="flex-grow overflow-x-auto pb-4">
                            <div className="min-w-min mx-auto">
                                <BusLayout 
                                    layoutType={route.bus.layoutType}
                                    customLayout={route.bus.layout}
                                    seatCount={route.bus.seatCount}
                                    occupiedSeats={occupiedSeats}
                                    selectedSeats={selectedSeats}
                                    onSeatSelect={handleSeatSelect}
                                    onSeatDeselect={handleSeatDeselect}
                                />
                            </div>
                        </div>

                        <div className="w-full xl:w-72 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-24">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Seçimleriniz</h3>
                            
                            {selectedSeats.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSeats.map(seat => (
                                            <div key={seat.number} className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 ${seat.gender === 'MALE' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'}`}>
                                                <User size={14} />
                                                <span>{seat.number}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-slate-500">Toplam</span>
                                        <span className="text-xl font-bold text-blue-600">{selectedSeats.length * route.price} TL</span>
                                    </div>

                                    <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg shadow-lg shadow-green-200">
                                        Devam Et
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Armchair className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Lütfen soldaki şemadan koltuk seçiniz.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
