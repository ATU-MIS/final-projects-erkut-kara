'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Need to create this
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Need to create this
import { Search, Ticket as TicketIcon, Calendar, MapPin, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PnrSorgulaPage() {
  const [pnr, setPnr] = useState('');
  const [phone, setPhone] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(false);

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['pnr-search', searchTrigger],
    queryFn: async () => {
      if (!pnr && !phone) return null;
      
      const params: any = {};
      if (pnr) params.pnrNumber = pnr;
      if (phone) params.userPhoneNumber = phone;

      // Use the generic search endpoint
      const { data } = await api.get('/tickets/search', { params });
      return data;
    },
    enabled: searchTrigger,
    retry: false
  });

  const handleSearch = () => {
    if (!pnr && !phone) return;
    setSearchTrigger(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 pt-32">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Bilet Sorgulama</h1>
            <p className="text-slate-500">Bilet bilgilerinizi görüntülemek için PNR kodunuzu veya telefon numaranızı giriniz.</p>
        </div>

        <Card className="mb-8 border-slate-200 shadow-lg">
            <CardHeader>
                <CardTitle>Sorgulama Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">PNR Kodu</label>
                    <Input 
                        placeholder="Örn: VV0012345" 
                        value={pnr} 
                        onChange={(e) => setPnr(e.target.value)} 
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Telefon Numarası</label>
                    <Input 
                        placeholder="5XX XXX XX XX" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                    />
                </div>
                <div className="md:col-span-2">
                    <Button onClick={handleSearch} className="w-full bg-varan-primary hover:bg-blue-700" size="lg">
                        <Search className="mr-2 h-4 w-4" /> Sorgula
                    </Button>
                </div>
            </CardContent>
        </Card>

        {isLoading && <div className="text-center py-8 text-slate-500">Aranıyor...</div>}
        
        {tickets && tickets.length === 0 && (
            <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg border border-red-100">
                Kayıt bulunamadı. Lütfen bilgilerinizi kontrol ediniz.
            </div>
        )}

        {tickets && tickets.map((ticket: any) => (
            <Card key={ticket.id} className="mb-4 overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <TicketIcon className="h-5 w-5 text-blue-400" />
                        <span className="font-mono font-bold text-lg">{ticket.pnrNumber}</span>
                    </div>
                    <div className="text-sm opacity-80">
                        {ticket.status === 'CONFIRMED' ? 'Onaylandı' : 'İptal Edildi'}
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Güzergah</p>
                                    <p className="font-bold text-lg text-slate-800">{ticket.route.fromCity} ➔ {ticket.route.toCity}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 mt-1">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Tarih & Saat</p>
                                    <p className="font-bold text-slate-800">
                                        {format(new Date(ticket.route.departureTime), "d MMMM yyyy, HH:mm", { locale: tr })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-1">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Yolcu</p>
                                    <p className="font-bold text-slate-800">{ticket.passengerName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">Koltuk: {ticket.seatNumber}</span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{ticket.gender === 'MALE' ? 'Bay' : 'Bayan'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-1">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">İletişim</p>
                                    <p className="font-bold text-slate-800">{ticket.userPhoneNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}