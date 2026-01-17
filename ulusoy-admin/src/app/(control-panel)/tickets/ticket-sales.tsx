'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Button,
	TextField,
	Paper,
	Typography,
    Autocomplete,
    Card,
    CardContent,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Divider
} from '@mui/material';
import { Search, EventSeat, CreditCard, ArrowBack } from '@mui/icons-material';
import api from '../../../@auth/api';
import { format } from 'date-fns';
import { BusLayout } from '../../components/BusLayout';

// Schema for Multiple Passengers with strict validation
const salesSchema = z.object({
    passengers: z.array(z.object({
        seatNumber: z.number(),
        gender: z.enum(['MALE', 'FEMALE']),
        tcKimlikNo: z.string()
            .length(11, 'TC Kimlik No 11 hane olmalıdır')
            .regex(/^\d+$/, 'Sadece rakam girilebilir'),
        passengerName: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
        userPhoneNumber: z.string()
            .length(10, 'Telefon 10 hane olmalıdır (5XXXXXXXXX)')
            .regex(/^\d+$/, 'Sadece rakam girilebilir'),
    }))
});

export function TicketSales() {
    const [stations, setStations] = useState<string[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [occupiedSeats, setOccupiedSeats] = useState<any[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
    
    // Search State
    const [fromCity, setFromCity] = useState<string | null>(null);
    const [toCity, setToCity] = useState<string | null>(null);
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    // Wizard Step State
    const [step, setStep] = useState(0); // 0: Seat, 1: Info

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(salesSchema),
        defaultValues: {
            passengers: []
        }
    });

    const { fields, replace } = useFieldArray({
        control,
        name: "passengers"
    });

    useEffect(() => {
        api.get('/stations').then(({ data }) => setStations(data.map((s: any) => s.name)));
    }, []);

    const handleSearch = async () => {
        if (!fromCity || !toCity || !date) return;
        try {
            const { data } = await api.get('/routes/search', {
                params: { fromCity, toCity, date }
            });
            setRoutes(data.data);
            setSelectedRoute(null);
            setSelectedSeats([]);
            setStep(0);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRouteSelect = async (route: any) => {
        if (selectedRoute?.id === route.id) {
            setSelectedRoute(null);
            return;
        }
        setSelectedRoute(route);
        setSelectedSeats([]);
        setStep(0);
        
        try {
            const { data: availableNumbers } = await api.get(`/tickets/available-seats/${route.id}`, {
                params: { 
                    fromCity: fromCity || route.fromCity, 
                    toCity: toCity || route.toCity 
                }
            });
            
            const allSeats = Array.from({ length: route.bus.seatCount }, (_, i) => i + 1);
            const occupied = allSeats
                .filter(n => !availableNumbers.includes(n))
                .map(n => ({ number: n, gender: 'MALE' })); 
            setOccupiedSeats(occupied);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSeatSelect = (seat: any) => {
        if (selectedSeats.find(s => s.number === seat.number)) return;
        if (selectedSeats.length >= 5) {
            alert('En fazla 5 koltuk seçebilirsiniz.');
            return;
        }
        setSelectedSeats([...selectedSeats, seat]);
    };

    const handleSeatDeselect = (seatNumber: number) => {
        setSelectedSeats(selectedSeats.filter(s => s.number !== seatNumber));
    };

    const handleNext = () => {
        if (selectedSeats.length > 0) {
            const initialPassengers = selectedSeats.map(seat => ({
                seatNumber: seat.number,
                gender: seat.gender,
                tcKimlikNo: '',
                passengerName: '',
                userPhoneNumber: ''
            }));
            replace(initialPassengers);
            setStep(1);
        }
    };

    const handleBack = () => {
        setStep(0);
    };

    const onSubmit = async (data: any) => {
        try {
            const promises = data.passengers.map((p: any) => 
                api.post('/tickets', {
                    routeId: selectedRoute.id,
                    seatNumber: p.seatNumber,
                    gender: p.gender,
                    fromCity: fromCity || selectedRoute.fromCity,
                    toCity: toCity || selectedRoute.toCity,
                    passengerName: p.passengerName,
                    userPhoneNumber: p.userPhoneNumber,
                    tcKimlikNo: p.tcKimlikNo
                })
            );

            await Promise.all(promises);
            
            alert('Satış başarıyla tamamlandı!');
            setSelectedSeats([]);
            reset();
            setStep(0);
            handleRouteSelect(selectedRoute);
        } catch (error: any) {
            const errorData = error.response?.data;
            console.error('Sale Error Detail:', errorData);
            
            if (error.response?.status === 401) {
                alert('Oturumunuzun süresi dolmuş veya geçersiz. Lütfen çıkış yapıp tekrar giriş yapın.');
            } else {
                alert(errorData?.message || 'Bilet oluşturulurken bir hata oluştu.');
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* 1. Search Bar */}
            <Paper className="p-6 flex flex-col md:flex-row gap-4 items-end" elevation={3}>
                <Autocomplete
                    options={stations}
                    value={fromCity}
                    onChange={(_, v) => setFromCity(v)}
                    renderInput={(params) => <TextField {...params} label="Nereden" fullWidth variant="outlined" />}
                    className="w-full md:w-64"
                />
                <Autocomplete
                    options={stations}
                    value={toCity}
                    onChange={(_, v) => setToCity(v)}
                    renderInput={(params) => <TextField {...params} label="Nereye" fullWidth variant="outlined" />}
                    className="w-full md:w-64"
                />
                <TextField 
                    type="date" 
                    label="Tarih" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    InputLabelProps={{ shrink: true }}
                    className="w-full md:w-48"
                />
                <Button variant="contained" size="large" onClick={handleSearch} startIcon={<Search />} color="primary">
                    Sefer Bul
                </Button>
            </Paper>

            {/* 2. Routes List */}
            <div className="flex flex-col gap-4">
                {routes.map(route => (
                    <Card key={route.id} variant="outlined" className={`border-l-4 ${selectedRoute?.id === route.id ? 'border-l-blue-500 ring-2 ring-blue-100' : 'border-l-transparent'}`}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => handleRouteSelect(route)}>
                                <div className="flex gap-6 items-center">
                                    <div className="text-center">
                                        <Typography variant="h5" fontWeight="bold">{format(new Date(route.departureTime), 'HH:mm')}</Typography>
                                        <Typography variant="caption" color="textSecondary">{route.bus.plate}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {fromCity || route.fromCity} ➔ {toCity || route.toCity}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {route.bus.layoutType === 'LAYOUT_2_1' ? '2+1' : '2+2'} • {route.price} TL
                                        </Typography>
                                    </div>
                                </div>
                                <Button variant={selectedRoute?.id === route.id ? 'contained' : 'outlined'}>
                                    {selectedRoute?.id === route.id ? 'Kapat' : 'Seç'}
                                </Button>
                            </div>

                            {/* 3. Wizard Content */}
                            {selectedRoute?.id === route.id && (
                                <div className="mt-6 pt-6 border-t animate-in fade-in">
                                    <Stepper activeStep={step} alternativeLabel className="mb-8">
                                        <Step><StepLabel>Koltuk Seçimi</StepLabel></Step>
                                        <Step><StepLabel>Yolcu Bilgileri</StepLabel></Step>
                                    </Stepper>

                                    {step === 0 && (
                                        <div className="flex flex-col items-center gap-6 w-full">
                                            <Paper 
                                                variant="outlined" 
                                                className="w-full overflow-x-auto p-4 flex justify-center bg-transparent border-slate-200 dark:border-slate-700"
                                                sx={{ bgcolor: 'background.default' }}
                                            >
                                                <div className="min-w-min">
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
                                            </Paper>
                                            
                                            {selectedSeats.length > 0 && (
                                                <Paper className="p-4 flex items-center gap-4 animate-in slide-in-from-bottom-2 border border-blue-100 dark:border-blue-900 shadow-lg" sx={{ bgcolor: 'background.paper' }}>
                                                    <div>
                                                        <Typography variant="subtitle2" fontWeight="bold">Seçilenler:</Typography>
                                                        <div className="flex gap-2 mt-1 flex-wrap justify-center">
                                                            {selectedSeats.map(s => (
                                                                <Chip key={s.number} label={`${s.number} (${s.gender === 'MALE' ? 'E' : 'K'})`} size="small" color={s.gender === 'MALE' ? 'primary' : 'secondary'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Button variant="contained" onClick={handleNext} color="primary" size="large">Devam Et</Button>
                                                </Paper>
                                            )}
                                        </div>
                                    )}

                                    {step === 1 && (
                                        <div className="max-w-4xl mx-auto w-full">
                                            <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>Koltuk Seçimine Dön</Button>
                                            
                                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-20">
                                                {fields.map((field, index) => (
                                                    <Paper key={field.id} className="p-6 border border-gray-200 dark:border-slate-700 relative" elevation={2} sx={{ bgcolor: 'background.paper' }}>
                                                        <div className="absolute top-4 right-4 font-bold text-gray-300 dark:text-gray-700 text-xl">
                                                            #{index + 1}
                                                        </div>
                                                        <Typography variant="subtitle1" className="mb-4 flex items-center gap-2 font-bold text-primary">
                                                            <EventSeat fontSize="small" /> 
                                                            Koltuk {field.seatNumber} 
                                                            <Chip 
                                                                label={field.gender === 'MALE' ? 'BAY' : 'BAYAN'} 
                                                                color={field.gender === 'MALE' ? 'primary' : 'secondary'} 
                                                                size="small" 
                                                                className="ml-2" 
                                                            />
                                                        </Typography>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <Controller
                                                                name={`passengers.${index}.tcKimlikNo`}
                                                                control={control}
                                                                render={({ field: { onChange, value, ...rest } }) => (
                                                                    <TextField 
                                                                        {...rest}
                                                                        value={value}
                                                                        label="TC Kimlik No" 
                                                                        size="small" 
                                                                        required 
                                                                        autoComplete="off"
                                                                        error={!!(errors.passengers?.[index]?.tcKimlikNo)}
                                                                        helperText={errors.passengers?.[index]?.tcKimlikNo?.message as string}
                                                                        inputProps={{ maxLength: 11 }}
                                                                        onChange={(e) => {
                                                                            // Strict numeric only, no spaces, max 11
                                                                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                            onChange(val);
                                                                        }}
                                                                        fullWidth 
                                                                    />
                                                                )}
                                                            />
                                                            <Controller
                                                                name={`passengers.${index}.passengerName`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <TextField {...field} label="Ad Soyad" size="small" required error={!!(errors.passengers?.[index]?.passengerName)} helperText={errors.passengers?.[index]?.passengerName?.message as string} fullWidth />
                                                                )}
                                                            />
                                                            <Controller
                                                                name={`passengers.${index}.userPhoneNumber`}
                                                                control={control}
                                                                render={({ field: { onChange, value, ...rest } }) => (
                                                                    <TextField 
                                                                        {...rest}
                                                                        value={value}
                                                                        label="Telefon" 
                                                                        size="small" 
                                                                        required 
                                                                        autoComplete="off"
                                                                        error={!!(errors.passengers?.[index]?.userPhoneNumber)}
                                                                        helperText={errors.passengers?.[index]?.userPhoneNumber?.message as string}
                                                                        inputProps={{ maxLength: 10 }}
                                                                        placeholder="5XXXXXXXXX"
                                                                        onChange={(e) => {
                                                                            // Strict numeric only, no spaces, max 10
                                                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                            onChange(val);
                                                                        }}
                                                                        fullWidth 
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                    </Paper>
                                                ))}
                                                
                                                <Paper className="p-4 flex justify-between items-center sticky bottom-4 z-10 border border-slate-200 dark:border-slate-700 shadow-lg mt-4" elevation={8} sx={{ bgcolor: 'background.paper' }}>
                                                    <div>
                                                        <Typography variant="caption" display="block">Toplam Tutar</Typography>
                                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                                            {selectedSeats.length * route.price} TL
                                                        </Typography>
                                                    </div>
                                                    <Button type="submit" variant="contained" color="success" size="large" startIcon={<CreditCard />} className="h-12 px-8 text-lg">
                                                        Satışı Tamamla
                                                    </Button>
                                                </Paper>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}