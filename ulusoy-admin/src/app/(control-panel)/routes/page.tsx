'use client';

import { useState, useEffect } from 'react';
import {
	Button,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Dialog,
	DialogTitle,
	DialogContent,
    DialogActions,
    Chip,
    Tooltip,
    IconButton,
    TextField,
    CircularProgress,
    TablePagination,
    useTheme,
    Box,
    Autocomplete
} from '@mui/material';
import { Add, Edit, Delete, ContentCopy, FilterList, LocationOn } from '@mui/icons-material';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '../../../@auth/api';
import { RouteForm } from './route-form';

function RoutesPage() {
    const theme = useTheme();
	const [routes, setRoutes] = useState<any[]>([]);
    const [totalRoutes, setTotalRoutes] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [stations, setStations] = useState<string[]>([]);
    
    // Filters
    const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Default today
    const [filterStation, setFilterStation] = useState<string | null>(null); // Station Filter

	const [open, setOpen] = useState(false);
	const [editingRoute, setEditingRoute] = useState<any>(null);
    
    // Duplicate Dialog State
    const [duplicateOpen, setDuplicateOpen] = useState(false);
    const [sourceRoute, setSourceRoute] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [copying, setCopying] = useState(false);

    // Fetch Stations for Filter
    useEffect(() => {
        api.get('/stations').then(({ data }) => {
            setStations(data.map((s: any) => s.name));
        });
    }, []);

	const fetchData = async () => {
		try {
            const params: any = {
                page: page + 1,
                limit: rowsPerPage,
                ignoreTimeCheck: 'true'
            };
            if (filterDate) params.date = filterDate;
            if (filterStation) params.fromCity = filterStation;

			const { data } = await api.get('/routes/search', { params });
			setRoutes(data.data);
            setTotalRoutes(data.meta.total);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, [page, rowsPerPage, filterDate, filterStation]); // Refetch on filter change

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

	const handleOpen = (route?: any) => {
		if (route) {
			setEditingRoute(route);
		} else {
			setEditingRoute(null);
		}
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		setEditingRoute(null);
	};

    const handleDelete = async (id: string) => {
        if(confirm('Silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/routes/${id}`);
                fetchData();
            } catch (error: any) {
                alert(error.response?.data?.message || 'Hata oluştu');
            }
        }
    }

    const handleSuccess = () => {
        handleClose();
        fetchData();
    };

    // Duplicate Logic
    const openDuplicate = (route: any) => {
        setSourceRoute(route);
        const nextDay = addDays(new Date(route.departureTime), 1);
        setStartDate(format(nextDay, 'yyyy-MM-dd'));
        setEndDate(format(addDays(nextDay, 6), 'yyyy-MM-dd'));
        setDuplicateOpen(true);
    };

    const handleDuplicateSubmit = async () => {
        if(!startDate || !endDate) return;
        setCopying(true);
        try {
            // Fetch full details of the source route to get routeStations with times
            const { data: fullSourceRoute } = await api.get(`/routes/${sourceRoute.id}`);
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            let current = start;
            const promises = [];
            const timeStr = format(new Date(fullSourceRoute.departureTime), 'HH:mm');
            
            while(current <= end) {
                const dateStr = format(current, 'yyyy-MM-dd');
                const newDepartureDate = new Date(`${dateStr}T${timeStr}`);
                
                // Calculate duration difference for arrival
                const totalDuration = new Date(fullSourceRoute.arrivalTime).getTime() - new Date(fullSourceRoute.departureTime).getTime();
                const newArrivalDate = new Date(newDepartureDate.getTime() + totalDuration);

                // Calculate intermediate stations times relative to new departure
                const formattedStations = fullSourceRoute.routeStations?.map((s: any) => {
                    const originalTime = new Date(s.time).getTime();
                    const originalDeparture = new Date(fullSourceRoute.departureTime).getTime();
                    const offset = originalTime - originalDeparture;
                    
                    // Add offset to new departure time
                    const newTime = new Date(newDepartureDate.getTime() + offset);
                    
                    // Adjust for potential timezone shift if crossing DST (simplified: just use ISO)
                    return {
                        station: s.station,
                        time: newTime.toISOString()
                    };
                }) || [];

                const payload = {
                    fromCity: fullSourceRoute.fromCity,
                    toCity: fullSourceRoute.toCity,
                    departureTime: newDepartureDate.toISOString(),
                    arrivalTime: newArrivalDate.toISOString(),
                    price: fullSourceRoute.price,
                    busId: fullSourceRoute.busId,
                    stations: formattedStations,
                    restStops: fullSourceRoute.restStops,
                    prices: fullSourceRoute.prices?.map((p: any) => ({
                        fromCity: p.fromCity,
                        toCity: p.toCity,
                        price: p.price,
                        isSold: p.isSold
                    })) || []
                };
                promises.push(api.post('/routes', payload));
                current = addDays(current, 1);
            }

            await Promise.all(promises);
            alert(`${promises.length} sefer kopyalandı.`);
            setDuplicateOpen(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert('Kopyalama sırasında hata: ' + (error.response?.data?.message || 'Bilinmeyen hata'));
        } finally {
            setCopying(false);
        }
    };

	return (
		<div className="flex w-full flex-col p-6 gap-6">
			<div className="flex flex-col md:flex-row items-center justify-between gap-4">
				<Typography variant="h4" className="font-bold">Sefer Yönetimi</Typography>
                
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Station Filter */}
                    <Autocomplete
                        options={stations}
                        value={filterStation}
                        onChange={(_, newValue) => setFilterStation(newValue)}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Kalkış Yeri" 
                                size="small" 
                                sx={{ width: 200, bgcolor: 'background.paper' }} 
                                InputProps={{ ...params.InputProps, startAdornment: <LocationOn color="action" fontSize="small" /> }}
                            />
                        )}
                    />

                    {/* Date Filter */}
                    <Paper className="flex items-center px-4 py-2 gap-2" variant="outlined">
                        <FilterList color="action" />
                        <Typography variant="body2" className="font-bold hidden sm:block">Tarih:</Typography>
                        <input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium dark:text-white"
                        />
                        <Button size="small" onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}>Bugün</Button>
                        <Button size="small" onClick={() => setFilterDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}>Yarın</Button>
                    </Paper>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<Add />}
                        onClick={() => handleOpen()}
                    >
                        Yeni Sefer
                    </Button>
                </div>
			</div>

			<Paper className="w-full overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Tarih</TableCell>
							<TableCell>Kalkış</TableCell>
							<TableCell>Varış</TableCell>
                            <TableCell>Duraklar</TableCell>
							<TableCell>Otobüs</TableCell>
                            <TableCell>Fiyat</TableCell>
                            <TableCell>Durum</TableCell>
							<TableCell align="right">İşlemler</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
                        {routes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" className="py-8 text-gray-500">
                                    Bu kriterlere uygun sefer bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
						{routes.map((route) => (
							<TableRow key={route.id} hover>
								<TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{format(new Date(route.departureTime), "HH:mm")}</span>
                                        <span className="text-xs text-gray-500">{format(new Date(route.departureTime), "d MMM yyyy", { locale: tr })}</span>
                                    </div>
                                </TableCell>
								<TableCell className="font-medium">{route.fromCity}</TableCell>
								<TableCell className="font-medium">{route.toCity}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {route.stations.map((s: string) => <Chip key={s} label={s} size="small" variant="outlined" />)}
                                    </div>
                                </TableCell>
								<TableCell>{route.bus?.plate}</TableCell>
                                <TableCell className="font-bold">{route.price} TL</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={route.isActive ? 'Aktif' : 'Pasif'} 
                                        color={route.isActive ? 'success' : 'default'} 
                                        size="small" 
                                    />
                                </TableCell>
								<TableCell align="right">
                                    <Tooltip title="Kopyala / Tekrarla">
                                        <IconButton 
                                            onClick={() => openDuplicate(route)}
                                            sx={{ color: theme.palette.info.light }} 
                                        >
                                            <ContentCopy />
                                        </IconButton>
                                    </Tooltip>
									<Button 
                                        startIcon={<Edit />} 
                                        onClick={() => handleOpen(route)}
                                        sx={{ color: theme.palette.warning.light }}
                                    >
										Düzenle
									</Button>
                                    <Button 
                                        startIcon={<Delete />} 
                                        onClick={() => handleDelete(route.id)}
                                        sx={{ color: theme.palette.error.light }}
                                    >
										Sil
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
                </div>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalRoutes}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Sayfa başına satır:"
                />
			</Paper>

			<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
				<DialogTitle>{editingRoute ? 'Seferi Düzenle' : 'Yeni Sefer Ekle'}</DialogTitle>
				<DialogContent className="pt-4">
                    <RouteForm initialData={editingRoute} onSuccess={handleSuccess} />
				</DialogContent>
			</Dialog>

            {/* Duplicate Dialog */}
            <Dialog open={duplicateOpen} onClose={() => setDuplicateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Seferi Kopyala / Tekrarla</DialogTitle>
                <DialogContent className="pt-4 flex flex-col gap-4">
                    <Typography variant="body2" className="mb-2">
                        Kaynak: <strong>{sourceRoute?.fromCity} - {sourceRoute?.toCity}</strong> ({format(new Date(sourceRoute?.departureTime || new Date()), "HH:mm")})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Bu seferi aşağıdaki tarih aralığındaki her güne kopyalar.
                    </Typography>
                    
                    <div className="flex gap-4">
                        <TextField
                            label="Başlangıç Tarihi"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <TextField
                            label="Bitiş Tarihi"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDuplicateOpen(false)}>İptal</Button>
                    <Button 
                        onClick={handleDuplicateSubmit} 
                        variant="contained" 
                        color="secondary"
                        disabled={copying}
                        startIcon={copying ? <CircularProgress size={20} color="inherit" /> : <ContentCopy />}
                    >
                        {copying ? 'Kopyalanıyor...' : 'Seferleri Oluştur'}
                    </Button>
                </DialogActions>
            </Dialog>
		</div>
	);
}

export default RoutesPage;
