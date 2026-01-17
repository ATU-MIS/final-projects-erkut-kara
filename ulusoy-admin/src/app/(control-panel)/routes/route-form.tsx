'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Button,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Autocomplete,
	Chip,
    Typography,
    Paper,
    IconButton,
    InputAdornment,
    Switch,
    FormControlLabel,
    Checkbox,
    FormGroup,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemButton,
    Divider
} from '@mui/material';
import { Delete, Add, AutoFixHigh, DateRange, AccessTime, Flag } from '@mui/icons-material';
import api from '../../../@auth/api';
import { useState, useEffect } from 'react';
import { addDays, format, isBefore, parseISO } from 'date-fns';

// Schema
const schema = z.object({
	fromCity: z.string().min(2, 'Kalkış yeri zorunlu'),
	toCity: z.string().min(2, 'Varış yeri zorunlu'),
	date: z.string().min(1, 'Kalkış tarihi zorunlu'),
	time: z.string().min(1, 'Kalkış saati zorunlu'),
    arrivalDate: z.string().min(1, 'Varış tarihi zorunlu'),
    arrivalTime: z.string().min(1, 'Varış saati zorunlu'),
	price: z.string().transform(v => parseFloat(v)), 
	busId: z.string().min(1, 'Otobüs zorunlu'),
	
    stations: z.array(z.object({
        station: z.string().min(1, 'Durak seçiniz'),
        time: z.string().min(1, 'Zaman seçiniz') 
    })).optional(),

	restStops: z.array(z.string()).optional(), 
    
    prices: z.array(z.object({
        fromCity: z.string(),
        toCity: z.string(),
        price: z.string(), 
        isSold: z.boolean().default(false) 
    })).optional(),

    isRecurring: z.boolean().default(false),
    endDate: z.string().optional(),
    days: z.array(z.number()).optional(), 
});

interface RouteFormProps {
	initialData?: any;
	onSuccess: () => void;
}

export function RouteForm({ initialData, onSuccess }: RouteFormProps) {
    const [buses, setBuses] = useState<any[]>([]);
    const [stationNames, setStationNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // UI State
    const [showPrices, setShowPrices] = useState(false);
    const [delayDialogOpen, setDelayDialogOpen] = useState(false);
    const [delayMinutes, setDelayMinutes] = useState('');
    const [selectedDelayTargets, setSelectedDelayTargets] = useState<string[]>([]);
    
    // Price Gen State
    const [priceGenOpen, setPriceGenOpen] = useState(false);
    const [selectedAnchorStops, setSelectedAnchorStops] = useState<string[]>([]);
    const [priceConfig, setPriceConfig] = useState({
        hourlyRate: 150,
        minPrice: 100,
        maxPrice: 2000,
        roundTo: 10
    });

	const { control, handleSubmit, watch, setValue, getValues } = useForm({
        shouldUnregister: false, // Critical for keeping hidden values
		defaultValues: initialData ? {
            ...initialData,
            date: new Date(initialData.departureTime).toISOString().split('T')[0],
            time: new Date(initialData.departureTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
            arrivalDate: new Date(initialData.arrivalTime).toISOString().split('T')[0],
            arrivalTime: new Date(initialData.arrivalTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
            price: initialData.price.toString(),
            stations: initialData.routeStations?.map((s: any) => ({
                station: s.station,
                time: format(new Date(s.time), "yyyy-MM-dd'T'HH:mm") 
            })) || [],
            restStops: initialData.restStops || [],
            prices: initialData.prices?.sort((a: any, b: any) => {
                // Reconstruct full stop order
                const fullStops = [
                    initialData.fromCity,
                    ...(initialData.routeStations?.map((s: any) => s.station) || []),
                    initialData.toCity
                ];
                
                const aFromIdx = fullStops.indexOf(a.fromCity);
                const aToIdx = fullStops.indexOf(a.toCity);
                const bFromIdx = fullStops.indexOf(b.fromCity);
                const bToIdx = fullStops.indexOf(b.toCity);
                
                if (aFromIdx !== bFromIdx) return aFromIdx - bFromIdx;
                return aToIdx - bToIdx;
            }).map((p: any) => ({
                fromCity: p.fromCity,
                toCity: p.toCity,
                price: p.price.toString(),
                isSold: p.isSold
            })) || [],
            isRecurring: false,
            endDate: '',
            days: [0,1,2,3,4,5,6]
        } : {
			fromCity: '',
			toCity: '',
			date: '',
			time: '',
            arrivalDate: '',
            arrivalTime: '',
			price: '',
			busId: '',
            stations: [],
            restStops: [],
            prices: [],
            isRecurring: false,
            endDate: '',
            days: [0,1,2,3,4,5,6]
		},
		resolver: zodResolver(schema)
	});

    const isRecurring = watch('isRecurring');
    const stationsList = watch('stations'); 

    const { fields: stationFields, append: appendStation, remove: removeStation, replace: replaceStations, insert: insertStation } = useFieldArray({
        control,
        name: "stations"
    });

    const { fields: priceFields, replace: replacePrices, remove: removePrice } = useFieldArray({
        control,
        name: "prices"
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [busesRes, stationsRes] = await Promise.all([
                    api.get('/buses'),
                    api.get('/stations')
                ]);
                setBuses(busesRes.data);
                setStationNames(stationsRes.data.map((s: any) => s.name));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleOpenDelay = () => {
        setSelectedDelayTargets([]);
        setDelayMinutes('');
        setDelayDialogOpen(true);
    };

    const toggleDelayTarget = (target: string) => {
        if (selectedDelayTargets.includes(target)) {
            setSelectedDelayTargets(selectedDelayTargets.filter(t => t !== target));
        } else {
            setSelectedDelayTargets([...selectedDelayTargets, target]);
        }
    };

    const toggleAllDelayTargets = () => {
        const allTargets = ['DEPARTURE', 'ARRIVAL', ...((stationsList || []).map((_, i) => i.toString()))];
        if (selectedDelayTargets.length === allTargets.length) {
            setSelectedDelayTargets([]);
        } else {
            setSelectedDelayTargets(allTargets);
        }
    };

    const applyDelay = () => {
        const minutes = parseInt(delayMinutes);
        if (isNaN(minutes) || minutes === 0) return;

        if (selectedDelayTargets.includes('DEPARTURE')) {
            const currentDate = getValues('date');
            const currentTime = getValues('time');
            if (currentDate && currentTime) {
                const dt = new Date(`${currentDate}T${currentTime}`);
                const newDt = new Date(dt.getTime() + minutes * 60000);
                setValue('date', format(newDt, 'yyyy-MM-dd'));
                setValue('time', format(newDt, 'HH:mm'));
            }
        }

        if (selectedDelayTargets.includes('ARRIVAL')) {
            const currentArrDate = getValues('arrivalDate');
            const currentArrTime = getValues('arrivalTime');
            if (currentArrDate && currentArrTime) {
                const dt = new Date(`${currentArrDate}T${currentArrTime}`);
                const newDt = new Date(dt.getTime() + minutes * 60000);
                setValue('arrivalDate', format(newDt, 'yyyy-MM-dd'));
                setValue('arrivalTime', format(newDt, 'HH:mm'));
            }
        }

        if (stationsList) {
            const updatedStations = stationsList.map((s: any, index: number) => {
                if (!selectedDelayTargets.includes(index.toString()) || !s.time) return s;
                
                const dt = new Date(s.time); 
                const newDt = new Date(dt.getTime() + minutes * 60000);
                return { ...s, time: format(newDt, "yyyy-MM-dd'T'HH:mm") };
            });
            replaceStations(updatedStations);
        }
        setDelayDialogOpen(false);
    };

    const openPriceGenerator = () => {
        const from = getValues('fromCity');
        const to = getValues('toCity');
        if (from && to) {
            const currentAnchors = new Set(selectedAnchorStops);
            currentAnchors.add(from);
            currentAnchors.add(to);
            setSelectedAnchorStops(Array.from(currentAnchors));
        }
        setPriceGenOpen(true);
    };

    const toggleAnchorStop = (stopName: string) => {
        if (selectedAnchorStops.includes(stopName)) {
            setSelectedAnchorStops(selectedAnchorStops.filter(s => s !== stopName));
        } else {
            setSelectedAnchorStops([...selectedAnchorStops, stopName]);
        }
    };

    const runPriceGeneration = () => {
        const from = getValues('fromCity');
        const to = getValues('toCity');
        const departureDateStr = getValues('date');
        const departureTimeStr = getValues('time');
        
        const startDt = new Date(`${departureDateStr}T${departureTimeStr}`);
        const intermediate = getValues('stations') || [];
        
        const arrivalDateStr = getValues('arrivalDate');
        const arrivalTimeStr = getValues('arrivalTime');
        const endDt = new Date(`${arrivalDateStr}T${arrivalTimeStr}`);

        if (!from || !to || isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
            alert('Lütfen önce kalkış/varış yerlerini ve saatlerini tam giriniz.');
            setPriceGenOpen(false);
            return;
        }

        const fullRoute = [
            { name: from, time: startDt },
            ...intermediate.map((s: any) => ({ name: s.station, time: new Date(s.time) })),
            { name: to, time: endDt }
        ];

        const findNextAnchor = (index: number) => {
            for (let i = index; i < fullRoute.length; i++) {
                if (selectedAnchorStops.includes(fullRoute[i].name)) return fullRoute[i];
            }
            return fullRoute[fullRoute.length - 1]; 
        };

        const newPrices = [];

        for (let i = 0; i < fullRoute.length; i++) {
            for (let j = i + 1; j < fullRoute.length; j++) {
                const segmentFrom = fullRoute[i];
                const segmentTo = fullRoute[j];
                
                const targetStop = selectedAnchorStops.includes(segmentTo.name) ? segmentTo : findNextAnchor(j);

                const diffMs = targetStop.time.getTime() - segmentFrom.time.getTime();
                const diffHours = Math.max(0, diffMs / (1000 * 60 * 60)); 

                let calculatedPrice = diffHours * priceConfig.hourlyRate;

                calculatedPrice = Math.max(priceConfig.minPrice, calculatedPrice);
                if (priceConfig.maxPrice > 0) calculatedPrice = Math.min(priceConfig.maxPrice, calculatedPrice);

                if (priceConfig.roundTo > 0) {
                    calculatedPrice = Math.ceil(calculatedPrice / priceConfig.roundTo) * priceConfig.roundTo;
                }

                newPrices.push({
                    fromCity: segmentFrom.name,
                    toCity: segmentTo.name,
                    price: calculatedPrice.toString(),
                    isSold: false 
                });
            }
        }
        
        replacePrices(newPrices);
        setPriceGenOpen(false);
        setShowPrices(true);
        alert(`${newPrices.length} adet fiyat oluşturuldu.`);
    };

	const onSubmit = async (data: any) => {
        console.log("Submitting Data:", data); // Debug
		try {
            setSubmitting(true);
            const departureDate = new Date(`${data.date}T${data.time}`);
            const arrivalDate = new Date(`${data.arrivalDate}T${data.arrivalTime}`); 

            if (arrivalDate <= departureDate) {
                alert('Varış zamanı kalkış zamanından sonra olmalıdır.');
                setSubmitting(false);
                return;
            }

            const formattedStations = data.stations?.map((s: any) => ({
                station: s.station,
                time: new Date(s.time).toISOString()
            })) || [];

            // Force get prices from form state and remove 'id' field inserted by useFieldArray
            const currentPrices = getValues('prices');
            const formattedPrices = currentPrices?.map(({ id, ...p }: any) => ({
                fromCity: p.fromCity,
                toCity: p.toCity,
                price: parseFloat(p.price),
                isSold: p.isSold
            })) || [];

			const payload = {
				fromCity: data.fromCity,
				toCity: data.toCity,
                departureTime: departureDate.toISOString(),
                arrivalTime: arrivalDate.toISOString(),
				price: data.price,
				busId: data.busId,
                stations: formattedStations,
                restStops: data.restStops,
                prices: formattedPrices 
			};

			if (initialData?.id) {
                // Update with prices included
                // const { prices, ...updatePayload } = payload; // Removed destructuring to include prices
				await api.patch(`/routes/${initialData.id}`, payload);
			} else {
                if (data.isRecurring && data.endDate) {
                    const endDate = parseISO(data.endDate);
                    let currentDate = departureDate;
                    const promises = [];
                    
                    const createRoute = async (dateObj: Date) => {
                        const dateStr = format(dateObj, 'yyyy-MM-dd');
                        const depDate = new Date(`${dateStr}T${data.time}`);
                        const duration = arrivalDate.getTime() - departureDate.getTime();
                        const arrDate = new Date(depDate.getTime() + duration);

                        const shiftedStations = formattedStations.map((s: any) => {
                            const originalTime = new Date(s.time).getTime();
                            const offset = originalTime - departureDate.getTime();
                            return {
                                station: s.station,
                                time: new Date(depDate.getTime() + offset).toISOString()
                            };
                        });

                        const recurPayload = {
                            ...payload,
                            departureTime: depDate.toISOString(),
                            arrivalTime: arrDate.toISOString(),
                            stations: shiftedStations
                        };
                        await api.post('/routes', recurPayload);
                    };

                    while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
                        if (data.days?.includes(currentDate.getDay())) {
                            promises.push(createRoute(currentDate));
                        }
                        currentDate = addDays(currentDate, 1);
                    }
                    await Promise.all(promises);
                } else {
				    await api.post('/routes', payload);
                }
			}
			onSuccess();
		} catch (error: any) {
			console.error(error);
            alert(error.response?.data?.message || 'Hata oluştu');
		} finally {
            setSubmitting(false);
        }
	};

	return (
		<form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.error(errors);
            alert(`Form Hatası: ${Object.keys(errors).join(', ')}. Konsolu kontrol edin.`);
        })} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="busId"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth required>
                            <InputLabel>Otobüs</InputLabel>
                            <Select {...field} label="Otobüs">
                                {buses.map(bus => (
                                    <MenuItem key={bus.id} value={bus.id}>{bus.plate} ({bus.model})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
                <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} type="number" label="Ana Fiyat (TL)" required fullWidth />
                    )}
                />
            </div>

            <Typography variant="subtitle1" className="font-bold border-b pb-2 mt-2">Sefer Bilgileri</Typography>
			<div className="grid grid-cols-2 gap-4">
                <Controller
                    name="fromCity"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <Autocomplete
                            options={stationNames}
                            value={value || null}
                            loading={loading}
                            onChange={(_, newValue) => onChange(newValue)}
                            componentsProps={{ popper: { sx: { zIndex: 99999 } } }}
                            renderInput={(params) => <TextField {...params} label="Kalkış Yeri" required />}
                        />
                    )}
                />
                <Controller
                    name="toCity"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <Autocomplete
                            options={stationNames}
                            value={value || null}
                            loading={loading}
                            onChange={(_, newValue) => onChange(newValue)}
                            componentsProps={{ popper: { sx: { zIndex: 99999 } } }}
                            renderInput={(params) => <TextField {...params} label="Varış Yeri" required />}
                        />
                    )}
                />
			</div>

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} type="date" label="Kalkış Tarihi" InputLabelProps={{ shrink: true }} required fullWidth />
                    )}
                />
                <Controller
                    name="time"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} type="time" label="Kalkış Saati" InputLabelProps={{ shrink: true }} required fullWidth />
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="arrivalDate"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} type="date" label="Varış Tarihi" InputLabelProps={{ shrink: true }} required fullWidth />
                    )}
                />
                <Controller
                    name="arrivalTime"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} type="time" label="Varış Saati" InputLabelProps={{ shrink: true }} required fullWidth />
                    )}
                />
            </div>

            <div className="flex justify-between items-center border-b pb-2 mt-4 px-2">
                <div className="flex items-center gap-4">
                    <Typography variant="subtitle1" className="font-bold">Ara Duraklar</Typography>
                    {initialData && (
                        <Button 
                            size="small" 
                            variant="outlined" 
                            color="warning" 
                            startIcon={<AccessTime />}
                            onClick={handleOpenDelay}
                            sx={{ borderColor: 'warning.main', color: 'warning.main' }}
                        >
                            Rötar Ekle
                        </Button>
                    )}
                </div>
                <Button 
                    size="small" 
                    variant="outlined"
                    color="inherit"
                    startIcon={<Add />} 
                    onClick={() => appendStation({ station: '', time: '' })}
                >
                    Sona Ekle
                </Button>
            </div>

            <div className="space-y-2">
                {stationFields.map((field, index) => (
                    <div key={field.id} className="relative group">
                        <Paper className="p-3 flex gap-4 items-center border border-slate-200 dark:border-slate-700" elevation={0} sx={{ bgcolor: 'background.paper' }}>
                            <Typography variant="body2" className="font-bold w-6 text-gray-500">{index + 1}.</Typography>
                            <Controller
                                name={`stations.${index}.station`}
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        options={stationNames}
                                        value={field.value || null}
                                        onChange={(_, newValue) => field.onChange(newValue)}
                                        componentsProps={{ popper: { sx: { zIndex: 99999 } } }}
                                        renderInput={(params) => <TextField {...params} label="Durak Adı" size="small" className="flex-grow min-w-[200px]" />}
                                    />
                                )}
                            />
                            <Controller
                                name={`stations.${index}.time`}
                                control={control}
                                render={({ field }) => (
                                    <TextField 
                                        {...field} 
                                        type="datetime-local" 
                                        label="Varış/Kalkış Zamanı" 
                                        size="small" 
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                            <IconButton color="error" size="small" onClick={() => removeStation(index)}>
                                <Delete fontSize="small" />
                            </IconButton>
                        </Paper>
                        
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                                size="small" 
                                variant="contained" 
                                color="secondary" 
                                startIcon={<Add />} 
                                sx={{ borderRadius: 10, fontSize: '0.6rem', height: 20, minWidth: 'auto', px: 1 }}
                                onClick={() => insertStation(index + 1, { station: '', time: '' })}
                            >
                                Araya Ekle
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Typography variant="subtitle1" className="font-bold border-b pb-2 mt-4">Tesisler</Typography>
            
            <Controller
                name="restStops"
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Autocomplete
                        multiple
                        options={stationNames} 
                        value={value || []}
                        loading={loading}
                        filterSelectedOptions
                        onChange={(_, newValue) => onChange(newValue)}
                        componentsProps={{ popper: { sx: { zIndex: 99999 } } }}
                        renderTags={(value: string[], getTagProps) =>
                            value.map((option: string, index: number) => (
                                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Mola Tesisleri" placeholder="Tesis ekle..." />
                        )}
                    />
                )}
            />

            {/* Recurrence Options */}
            {!initialData && (
                <Paper className="p-4 bg-orange-50/10 border border-orange-200 mt-4">
                    <div className="flex items-center gap-4 mb-2">
                        <DateRange color="action" />
                        <Typography variant="subtitle2" className="font-bold text-orange-500">Seferi Tekrarla</Typography>
                        <Controller
                            name="isRecurring"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Switch checked={value} onChange={e => onChange(e.target.checked)} color="warning" />
                            )}
                        />
                    </div>
                    
                    {isRecurring && (
                        <div className="space-y-4 animate-in fade-in">
                            <Controller
                                name="endDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} type="date" label="Bitiş Tarihi" InputLabelProps={{ shrink: true }} fullWidth required={isRecurring} />
                                )}
                            />
                            <div>
                                <Typography variant="caption" className="block mb-1 font-bold">Tekrar Günleri</Typography>
                                <Controller
                                    name="days"
                                    control={control}
                                    render={({ field }) => (
                                        <FormGroup row>
                                            {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, idx) => (
                                                <FormControlLabel
                                                    key={day}
                                                    control={
                                                        <Checkbox 
                                                            checked={field.value?.includes(idx)}
                                                            onChange={(e) => {
                                                                const newVal = e.target.checked 
                                                                    ? [...(field.value || []), idx]
                                                                    : (field.value || []).filter(d => d !== idx);
                                                                field.onChange(newVal);
                                                            }}
                                                        />
                                                    }
                                                    label={day}
                                                />
                                            ))}
                                        </FormGroup>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </Paper>
            )}

            {/* Price Matrix Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mt-4 px-2">
                <div className="flex items-center gap-4">
                    <Typography variant="subtitle1" className="font-bold">Segment Fiyatları</Typography>
                    <Button 
                        size="small" 
                        onClick={() => setShowPrices(!showPrices)}
                        variant="outlined"
                        color="info"
                    >
                        {showPrices ? 'Gizle' : 'Göster / Düzenle'}
                    </Button>
                </div>
                {showPrices && (
                    <Button 
                        size="small" 
                        variant="contained"
                        startIcon={<AutoFixHigh />} 
                        onClick={openPriceGenerator}
                        color="primary"
                    >
                        Fiyatları Oluştur
                    </Button>
                )}
            </div>
            
            {/* Price Matrix Body - CSS Display for persistence */}
            <div className="max-h-96 overflow-y-auto space-y-2 pt-2 pr-2 custom-scrollbar" style={{ display: showPrices ? 'block' : 'none' }}>
                {priceFields.length === 0 && <Typography variant="body2" color="textSecondary" align="center" className="py-4">Fiyat listesi boş. Otomatik oluştur butonuna basın.</Typography>}
                
                {priceFields.map((field, index) => (
                    <Paper key={field.id} className="p-3 flex gap-4 items-center justify-between border border-slate-200 dark:border-slate-700" elevation={0} sx={{ bgcolor: 'background.paper' }}>
                        <div className="flex items-center gap-2 text-sm font-medium flex-grow">
                            <span className="text-primary font-bold">{field.fromCity}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-primary font-bold">{field.toCity}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <Controller
                                name={`prices.${index}.price`}
                                control={control}
                                render={({ field }) => (
                                    <TextField 
                                        {...field} 
                                        type="number" 
                                        label="Fiyat" 
                                        size="small" 
                                        className="w-28" 
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">TL</InputAdornment>,
                                        }}
                                    />
                                )}
                            />
                            
                            <Controller
                                name={`prices.${index}.isSold`}
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch 
                                                checked={!!value} 
                                                onChange={(e) => onChange(e.target.checked)} 
                                                color="success"
                                            />
                                        }
                                        label={value ? "Satışta" : "Kapalı"}
                                        labelPlacement="start"
                                        sx={{ mr: 0, color: value ? 'success.main' : 'text.disabled' }}
                                    />
                                )}
                            />

                            <IconButton color="error" size="small" onClick={() => removePrice(index)}>
                                <Delete fontSize="small" />
                            </IconButton>
                        </div>
                    </Paper>
                ))}
            </div>

			<div className="flex justify-end pt-4">
                <Button onClick={() => onSuccess()} className="mr-2" color="inherit">İptal</Button>
				<Button type="submit" variant="contained" color="secondary" size="large" disabled={submitting}>
					{submitting ? <CircularProgress size={24} /> : 'Kaydet'}
				</Button>
			</div>

            {/* Price Generator Dialog */}
            <Dialog open={priceGenOpen} onClose={() => setPriceGenOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Otomatik Fiyatlandırma</DialogTitle>
                <DialogContent dividers>
                    <div className="flex flex-col gap-4 pt-2">
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" color="textPrimary" className="mb-2 font-bold flex items-center gap-2">
                                <Flag fontSize="small" color="primary"/> Ana Duraklar (Anchor Stops)
                            </Typography>
                            <Typography variant="caption" color="textSecondary" className="block mb-2">
                                Ana duraklar arası fiyatı belirler. Ara duraklar, kendisinden sonraki ilk Ana Durağın fiyatını kullanır.
                            </Typography>
                            
                            <List dense sx={{ maxHeight: 160, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                                {[
                                    {station: getValues('fromCity'), time: ''}, 
                                    ...(stationsList || []), 
                                    {station: getValues('toCity'), time: ''}
                                ].map((s: any, idx) => (
                                    <ListItem key={idx} disablePadding>
                                        <ListItemButton dense onClick={() => toggleAnchorStop(s.station)}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedAnchorStops.includes(s.station)}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={s.station} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>

                        <Divider />

                        <TextField
                            label="Saatlik Ücret (TL)"
                            type="number"
                            fullWidth
                            value={priceConfig.hourlyRate}
                            onChange={(e) => setPriceConfig({...priceConfig, hourlyRate: parseInt(e.target.value) || 0})}
                            helperText="Örn: 1.5 saatlik yol = 1.5 x Saatlik Ücret"
                        />
                        <div className="flex gap-4">
                            <TextField
                                label="Min Fiyat"
                                type="number"
                                fullWidth
                                value={priceConfig.minPrice}
                                onChange={(e) => setPriceConfig({...priceConfig, minPrice: parseInt(e.target.value) || 0})}
                            />
                            <TextField
                                label="Max Fiyat"
                                type="number"
                                fullWidth
                                value={priceConfig.maxPrice}
                                onChange={(e) => setPriceConfig({...priceConfig, maxPrice: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <TextField
                            label="Yuvarlama"
                            type="number"
                            fullWidth
                            value={priceConfig.roundTo}
                            onChange={(e) => setPriceConfig({...priceConfig, roundTo: parseInt(e.target.value) || 0})}
                            helperText="Örn: 10 (123 -> 130)"
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPriceGenOpen(false)} color="inherit">İptal</Button>
                    <Button onClick={runPriceGeneration} variant="contained" color="primary">Hesapla ve Doldur</Button>
                </DialogActions>
            </Dialog>

            {/* Delay Dialog */}
            <Dialog open={delayDialogOpen} onClose={() => setDelayDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Gecikme / Rötar Yönetimi</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" className="mb-4 text-gray-500">
                        Seçilen durakların saatlerine girilen süre kadar (dakika) ekleme yapılır.
                    </Typography>
                    
                    <div className="flex gap-4 mb-4 items-center">
                        <TextField 
                            label="Gecikme (Dakika)"
                            type="number"
                            fullWidth
                            value={delayMinutes}
                            onChange={(e) => setDelayMinutes(e.target.value)}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">dk</InputAdornment>,
                            }}
                        />
                        <Button variant="outlined" onClick={toggleAllDelayTargets}>
                            {selectedDelayTargets.length > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                        </Button>
                    </div>

                    <List dense sx={{ width: '100%', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => toggleDelayTarget('DEPARTURE')}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedDelayTargets.includes('DEPARTURE')}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={`Kalkış: ${getValues('fromCity')}`} secondary={getValues('time')} />
                            </ListItemButton>
                        </ListItem>
                        
                        {(stationsList || []).map((s: any, idx: number) => (
                            <ListItem key={idx} disablePadding>
                                <ListItemButton onClick={() => toggleDelayTarget(idx.toString())}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedDelayTargets.includes(idx.toString())}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={`Durak ${idx+1}: ${s.station}`} 
                                        secondary={s.time ? new Date(s.time).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '-'} 
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}

                        <ListItem disablePadding>
                            <ListItemButton onClick={() => toggleDelayTarget('ARRIVAL')}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedDelayTargets.includes('ARRIVAL')}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={`Varış: ${getValues('toCity')}`} secondary={getValues('arrivalTime')} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDelayDialogOpen(false)} color="inherit">İptal</Button>
                    <Button onClick={applyDelay} variant="contained" color="warning">Uygula</Button>
                </DialogActions>
            </Dialog>
		</form>
	);
}