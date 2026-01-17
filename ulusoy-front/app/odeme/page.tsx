'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, CreditCard, Ticket } from 'lucide-react';

// Schema
const passengerSchema = z.object({
    passengers: z.array(z.object({
        seatNumber: z.number(),
        gender: z.enum(['MALE', 'FEMALE']),
        tcKimlikNo: z.string().length(11, 'TC Kimlik No 11 haneli olmalıdır').regex(/^\d+$/, 'Sadece rakam giriniz'),
        passengerName: z.string().min(3, 'Ad Soyad en az 3 karakter olmalıdır'),
        userPhoneNumber: z.string().length(10, 'Telefon numarası başında 0 olmadan 10 haneli olmalıdır').regex(/^\d+$/, 'Sadece rakam giriniz'),
    })),
    cardHolderName: z.string().min(3, 'Kart üzerindeki isim zorunludur'),
    cardNumber: z.string().min(16, 'Kart numarası geçersiz').max(19),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'AA/YY formatında olmalıdır'),
    cvv: z.string().length(3, 'CVV 3 haneli olmalıdır')
});

export default function OdemePage() {
    const router = useRouter();
    const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
    const [routeId, setRouteId] = useState<string | null>(null);
    const [routePrice, setRoutePrice] = useState<number>(0);
    const [fromCity, setFromCity] = useState<string>('');
    const [toCity, setToCity] = useState<string>('');

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(passengerSchema),
        defaultValues: {
            passengers: [],
            cardHolderName: '',
            cardNumber: '',
            expiryDate: '',
            cvv: ''
        }
    });

    const { fields, replace } = useFieldArray({
        control,
        name: "passengers"
    });

    useEffect(() => {
        const storedSeats = localStorage.getItem('selectedSeats');
        const storedRouteId = localStorage.getItem('routeId');
        const storedPrice = localStorage.getItem('routePrice');
        const storedFrom = localStorage.getItem('fromCity');
        const storedTo = localStorage.getItem('toCity');

        if (storedSeats && storedRouteId && storedPrice) {
            const seats = JSON.parse(storedSeats);
            setSelectedSeats(seats);
            setRouteId(storedRouteId);
            setRoutePrice(parseFloat(storedPrice));
            setFromCity(storedFrom || '');
            setToCity(storedTo || '');

            // Initialize form fields for each seat
            const initialPassengers = seats.map((seat: any) => ({
                seatNumber: seat.number,
                gender: seat.gender,
                tcKimlikNo: '',
                passengerName: '',
                userPhoneNumber: ''
            }));
            replace(initialPassengers);
        } else {
            router.push('/');
        }
    }, [replace, router]);

    const onSubmit = async (data: any) => {
        try {
            // In a real app, you would process payment here first.
            // For now, we simulate success and create tickets.

            const promises = data.passengers.map((p: any) => 
                api.post('/tickets', {
                    routeId: routeId,
                    seatNumber: p.seatNumber,
                    gender: p.gender,
                    fromCity: fromCity,
                    toCity: toCity,
                    passengerName: p.passengerName,
                    userPhoneNumber: p.userPhoneNumber,
                    tcKimlikNo: p.tcKimlikNo
                })
            );

            await Promise.all(promises);
            
            alert('Biletleriniz başarıyla oluşturuldu!');
            localStorage.clear();
            router.push('/pnr-sorgula'); // Redirect to PNR query page to view tickets (or show success page)
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'İşlem sırasında bir hata oluştu.');
        }
    };

    if (selectedSeats.length === 0) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-12 pt-32">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">Ödeme ve Yolcu Bilgileri</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Passenger Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="border-slate-200 shadow-md">
                                <CardHeader className="bg-slate-100/50 border-b border-slate-100 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="text-blue-600" />
                                        <span>{index + 1}. Yolcu</span>
                                        <span className="text-sm font-normal text-slate-500 ml-auto bg-white px-3 py-1 rounded-full border">
                                            Koltuk: <span className="font-bold text-slate-800">{field.seatNumber}</span> ({field.gender === 'MALE' ? 'Bay' : 'Bayan'})
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>TC Kimlik No</Label>
                                        <Controller
                                            name={`passengers.${index}.tcKimlikNo`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input 
                                                    {...field} 
                                                    maxLength={11} 
                                                    placeholder="11111111111" 
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                        field.onChange(val);
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.passengers?.[index]?.tcKimlikNo && <span className="text-xs text-red-500">{errors.passengers[index]?.tcKimlikNo?.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ad Soyad</Label>
                                        <Controller
                                            name={`passengers.${index}.passengerName`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} placeholder="Ad Soyad" />
                                            )}
                                        />
                                        {errors.passengers?.[index]?.passengerName && <span className="text-xs text-red-500">{errors.passengerName?.message}</span>}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Cep Telefonu</Label>
                                        <Controller
                                            name={`passengers.${index}.userPhoneNumber`}
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">0</span>
                                                    <Input 
                                                        {...field} 
                                                        className="rounded-l-none" 
                                                        maxLength={10} 
                                                        placeholder="5XX XXX XX XX" 
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                            field.onChange(val);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        />
                                        {errors.passengers?.[index]?.userPhoneNumber && <span className="text-xs text-red-500">{errors.passengers[index]?.userPhoneNumber?.message}</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Payment Info */}
                        <Card className="border-slate-200 shadow-md">
                            <CardHeader className="bg-slate-100/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="text-green-600" />
                                    <span>Ödeme Bilgileri</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Kart Üzerindeki İsim</Label>
                                    <Controller name="cardHolderName" control={control} render={({ field }) => <Input {...field} />} />
                                    {errors.cardHolderName && <span className="text-xs text-red-500">{errors.cardHolderName.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Kart Numarası</Label>
                                    <Controller name="cardNumber" control={control} render={({ field }) => <Input {...field} maxLength={19} placeholder="XXXX XXXX XXXX XXXX" />} />
                                    {errors.cardNumber && <span className="text-xs text-red-500">{errors.cardNumber.message}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Son Kullanma Tarihi</Label>
                                        <Controller name="expiryDate" control={control} render={({ field }) => <Input {...field} placeholder="AA/YY" maxLength={5} />} />
                                        {errors.expiryDate && <span className="text-xs text-red-500">{errors.expiryDate.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVV</Label>
                                        <Controller name="cvv" control={control} render={({ field }) => <Input {...field} maxLength={3} type="password" />} />
                                        {errors.cvv && <span className="text-xs text-red-500">{errors.cvv.message}</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card className="bg-slate-800 text-white border-none shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Ticket className="text-yellow-400" /> Sefer Özeti
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Güzergah</p>
                                        <p className="font-bold text-lg">{fromCity} ➔ {toCity}</p>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-300">Bilet Adedi</span>
                                            <span className="font-bold">{selectedSeats.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-300">Birim Fiyat</span>
                                            <span className="font-bold">{routePrice} TL</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-600 mt-2">
                                            <span className="text-lg">Toplam Tutar</span>
                                            <span className="text-2xl font-bold text-yellow-400">{selectedSeats.length * routePrice} TL</span>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 text-lg shadow-lg shadow-green-900/20 mt-4">
                                        Ödemeyi Tamamla
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
