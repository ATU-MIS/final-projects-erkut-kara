'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../@auth/api';
import {
	Button,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Box,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { Search, Close, Print, ReceiptLong, Person, Phone, CreditCard } from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TicketSales } from './ticket-sales'; // Import here

// --- Tab 1: Ticket Search & Management ---
function TicketSearchPanel() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const { data: tickets, isLoading, error } = useQuery({
        queryKey: ['tickets', activeSearch],
        queryFn: async () => {
            if (!activeSearch) return [];
            
            const isDigitsOnly = /^\d+$/.test(activeSearch);
            const isPNR = !isDigitsOnly && activeSearch.length >= 6; // If has letters, it's PNR
            
            const params: any = {};
            if (isPNR) {
                params.pnrNumber = activeSearch;
            } else if (isDigitsOnly) {
                // If 11 digits and starts with non-zero (usually), assume TC. 
                // But phones can also be 11 digits (05...).
                // Let's assume: Starts with 0 -> Phone. Does not start with 0 -> TC.
                if (activeSearch.length === 11 && !activeSearch.startsWith('0')) {
                    params.tcKimlikNo = activeSearch;
                } else {
                    // Assume phone number (partial match allowed in backend)
                    params.userPhoneNumber = activeSearch;
                }
            } else {
                params.pnrNumber = activeSearch; // Fallback
            } 

            const { data } = await api.get('/tickets/search', { params });
            return data;
        },
        enabled: !!activeSearch,
        retry: false
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/tickets/${id}/cancel`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            alert('Bilet iptal edildi.');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Hata oluştu');
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(searchQuery);
    };

    const handleCancel = (id: string) => {
        if (confirm("Bu bileti iptal etmek istediğinize emin misiniz?")) {
            cancelMutation.mutate(id);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <Paper className="p-6">
                <Typography variant="h6" className="mb-4">Bilet Sorgula</Typography>
                <form onSubmit={handleSearch} className="flex gap-4">
                    <TextField
                        fullWidth
                        label="PNR, Telefon veya TC Kimlik No"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button type="submit" variant="contained" size="large" color="primary" disabled={!searchQuery}>
                        Sorgula
                    </Button>
                </form>
            </Paper>

            {isLoading && <Typography className="text-center py-4">Aranıyor...</Typography>}
            
            {error && <Typography color="error" className="text-center">Bir hata oluştu veya bilet bulunamadı.</Typography>}

            {tickets && tickets.length === 0 && activeSearch && !isLoading && (
                <Typography className="text-center py-4 text-gray-500">Kayıt bulunamadı.</Typography>
            )}

            <div className="grid gap-4">
                {tickets?.map((ticket: any) => (
                    <Card key={ticket.id} variant="outlined" className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                            {/* Ticket Header */}
                            <div className="bg-slate-50 p-4 border-b flex justify-between items-center dark:bg-slate-800 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <Chip label={ticket.pnrNumber} color="primary" className="font-bold font-mono text-lg" />
                                    <Chip 
                                        label={ticket.status} 
                                        color={ticket.status === 'CONFIRMED' ? 'success' : ticket.status === 'CANCELLED' ? 'error' : 'default'} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                </div>
                                <div className="text-sm text-gray-500">
                                    Satış Tarihi: {format(new Date(ticket.createdAt), "d MMM yyyy HH:mm", { locale: tr })}
                                </div>
                            </div>

                            {/* Ticket Body */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Passenger Info */}
                                <div>
                                    <Typography variant="caption" className="font-bold text-gray-400 uppercase">Yolcu</Typography>
                                    <div className="flex items-start gap-2 mt-1">
                                        <Person color="action" />
                                        <div>
                                            <Typography variant="subtitle1" className="font-bold">{ticket.passengerName}</Typography>
                                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <Phone fontSize="small" /> {ticket.userPhoneNumber}
                                            </div>
                                            {ticket.tcKimlikNo && <Typography variant="caption" className="block text-gray-500">TC: {ticket.tcKimlikNo}</Typography>}
                                        </div>
                                    </div>
                                </div>

                                {/* Journey Info */}
                                <div>
                                    <Typography variant="caption" className="font-bold text-gray-400 uppercase">Sefer</Typography>
                                    <div className="mt-1">
                                        <Typography variant="h6" className="font-bold flex items-center gap-2">
                                            {ticket.route.fromCity} 
                                            <span className="text-gray-400 text-sm">➔</span> 
                                            {ticket.route.toCity}
                                        </Typography>
                                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                                            {format(new Date(ticket.route.departureTime), "d MMMM yyyy, EEEE HH:mm", { locale: tr })}
                                        </Typography>
                                        <div className="mt-2 flex gap-2">
                                            <Chip label={`Koltuk: ${ticket.seatNumber}`} size="small" className="font-bold" />
                                            <Chip label={ticket.route.bus.plate} size="small" variant="outlined" />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment & Actions */}
                                <div className="flex flex-col justify-between items-end">
                                    <div className="text-right">
                                        <Typography variant="caption" className="font-bold text-gray-400 uppercase">Tutar</Typography>
                                        <Typography variant="h5" className="font-bold text-primary">{ticket.price} TL</Typography>
                                        <Typography variant="caption" className="text-green-600 flex items-center justify-end gap-1">
                                            <CreditCard fontSize="small" /> {ticket.paymentStatus}
                                        </Typography>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-4">
                                        <Tooltip title="Yazdır">
                                            <IconButton><Print /></IconButton>
                                        </Tooltip>
                                        {ticket.status !== 'CANCELLED' && (
                                            <Button 
                                                variant="outlined" 
                                                color="error" 
                                                size="small" 
                                                startIcon={<Close />}
                                                onClick={() => handleCancel(ticket.id)}
                                            >
                                                İptal Et
                                            </Button>
                                        )}
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

// --- Main Page Component ---
function TicketsPage() {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

	return (
		<div className="flex w-full flex-col p-6 gap-6">
            <Typography variant="h4" className="font-bold">Bilet İşlemleri</Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Bilet Sorgula & Yönet" icon={<Search />} iconPosition="start" />
                    <Tab label="Yeni Bilet Kes (Satış)" icon={<ReceiptLong />} iconPosition="start" />
                </Tabs>
            </Box>

            <div className="py-4">
                {tabValue === 0 && <TicketSearchPanel />}
                {tabValue === 1 && <TicketSales />}
            </div>
		</div>
	);
}

export default TicketsPage;