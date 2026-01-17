'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Checkbox,
	FormControlLabel,
    Chip,
    TablePagination,
    useTheme,
    Autocomplete,
    Avatar
} from '@mui/material';
import { Add, Edit, Delete, Settings } from '@mui/icons-material';
import api from '../../../@auth/api';
import { useRouter } from 'next/navigation';

// Schema
const schema = z.object({
	plate: z.string().min(2, 'Plaka zorunlu'),
	model: z.string().min(2, 'Model zorunlu'),
	seatCount: z.string().transform(v => parseInt(v)),
    layoutId: z.string().min(1, 'Koltuk düzeni seçimi zorunludur'),
    
    owner: z.string().optional(),
    busPhone: z.string().optional(),
    taxOffice: z.string().optional(),
    taxNumber: z.string().optional(),
    
    // Dynamic Features
    features: z.array(z.string()).optional(),

    // Test Location
    testLat: z.string().optional(),
    testLng: z.string().optional()
});

function BusesPage() {
    const router = useRouter();
    const theme = useTheme();
	const [buses, setBuses] = useState<any[]>([]);
	const [layouts, setLayouts] = useState<any[]>([]); 
    const [busFeatures, setBusFeatures] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [editingBus, setEditingBus] = useState<any>(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

	const { control, handleSubmit, reset, setValue } = useForm({
		defaultValues: {
			plate: '',
			model: '',
			seatCount: '46',
            layoutId: '',
            owner: '',
            busPhone: '',
            taxOffice: '',
            taxNumber: '',
            features: [],
            testLat: '',
            testLng: ''
		},
		resolver: zodResolver(schema)
	});

	const fetchData = async () => {
		try {
            const [busesRes, layoutsRes, featuresRes] = await Promise.all([
                api.get('/buses'),
                api.get('/seat-layouts'),
                api.get('/bus-features')
            ]);
			setBuses(busesRes.data);
            setLayouts(layoutsRes.data);
            setBusFeatures(featuresRes.data);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

	const handleOpen = (bus?: any) => {
		if (bus) {
			setEditingBus(bus);
            setValue('plate', bus.plate);
            setValue('model', bus.model);
            setValue('seatCount', bus.seatCount.toString());
            setValue('layoutId', bus.layoutId || '');
            setValue('owner', bus.owner || '');
            setValue('busPhone', bus.busPhone || '');
            setValue('taxOffice', bus.taxOffice || '');
            setValue('taxNumber', bus.taxNumber || '');
            setValue('features', bus.features?.map((f: any) => f.id) || []);
            setValue('testLat', bus.testLat?.toString() || '');
            setValue('testLng', bus.testLng?.toString() || '');
		} else {
			setEditingBus(null);
			reset();
		}
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		reset();
	};

	const onSubmit = async (data: any) => {
		try {
            const payload = {
                plate: data.plate,
                model: data.model,
                seatCount: parseInt(data.seatCount), 
                layoutId: data.layoutId, 
                layoutType: 'LAYOUT_2_1', 
                owner: data.owner,
                busPhone: data.busPhone,
                taxOffice: data.taxOffice,
                taxNumber: data.taxNumber,
                features: data.features,
                testLat: data.testLat ? parseFloat(data.testLat) : null,
                testLng: data.testLng ? parseFloat(data.testLng) : null
            };

			if (editingBus) {
				await api.patch(`/buses/${editingBus.id}`, payload);
			} else {
				await api.post('/buses', payload);
			}
			fetchData();
			handleClose();
		} catch (error: any) {
			console.error('API Error:', error.response?.data);
            alert(`Hata: ${JSON.stringify(error.response?.data?.message || 'Bilinmeyen hata')}`);
		}
	};

    const handleDelete = async (id: string) => {
        if(confirm('Silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/buses/${id}`);
                fetchData();
            } catch (error: any) {
                console.error(error);
                alert(error.response?.data?.message || 'Silme işlemi başarısız. Bu otobüse bağlı aktif seferler olabilir.');
            }
        }
    }

    const paginatedBuses = buses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<div className="flex w-full flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<Typography variant="h4" className="font-bold">Otobüs Yönetimi</Typography>
                <div className="flex gap-2">
                    <Button
                        variant="contained"
                        color="info" 
                        startIcon={<Settings />}
                        onClick={() => router.push('/bus-features')}
                    >
                        Özellik Yönetimi
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<Add />}
                        onClick={() => handleOpen()}
                    >
                        Yeni Otobüs
                    </Button>
                </div>
			</div>

			<Paper className="w-full overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Plaka</TableCell>
							<TableCell>Model</TableCell>
							<TableCell>Koltuk</TableCell>
							<TableCell>Düzen</TableCell>
                            <TableCell>Özellikler</TableCell>
                            <TableCell>Konum</TableCell>
                            <TableCell>Sahibi</TableCell>
							<TableCell align="right">İşlemler</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedBuses.map((bus) => (
							<TableRow key={bus.id} hover>
								<TableCell className="font-medium">{bus.plate}</TableCell>
								<TableCell>{bus.model}</TableCell>
								<TableCell>
                                    <Chip label={bus.seatCount} size="small" />
                                </TableCell>
								<TableCell>
                                    {bus.layout ? (
                                        <Chip label={bus.layout.name} color="primary" size="small" />
                                    ) : (
                                        <Chip label="Standart" variant="outlined" size="small" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        {bus.features?.map((f: any) => (
                                            <Avatar 
                                                key={f.id} 
                                                src={`http://localhost:3000${f.iconPath}`} 
                                                alt={f.name} 
                                                title={f.name}
                                                sx={{ width: 24, height: 24 }}
                                                variant="rounded"
                                            />
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {bus.testLat ? <Chip label="Var" color="success" size="small" /> : <Chip label="Yok" size="small" variant="outlined" />}
                                </TableCell>
                                <TableCell>{bus.owner || '-'}</TableCell>
								<TableCell align="right">
									<Button 
                                        startIcon={<Edit />} 
                                        onClick={() => handleOpen(bus)}
                                        sx={{ color: theme.palette.warning.light }}
                                    >
										Düzenle
									</Button>
                                    <Button 
                                        startIcon={<Delete />} 
                                        onClick={() => handleDelete(bus.id)}
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
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={buses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Sayfa başına satır:"
                />
			</Paper>

			<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
				<DialogTitle>{editingBus ? 'Otobüsü Düzenle' : 'Yeni Otobüs'}</DialogTitle>
				<DialogContent className="pt-4 flex flex-col gap-4">
                    <div className="flex gap-4 pt-2">
                        <Controller
                            name="plate"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Plaka" fullWidth required />
                            )}
                        />
                        <Controller
                            name="model"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Model" fullWidth required />
                            )}
                        />
                    </div>

                    <div className="flex gap-4">
                        <Controller
                            name="seatCount"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Koltuk Sayısı" type="number" fullWidth required />
                            )}
                        />
                        
                        <Controller
                            name="layoutId"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth required>
                                    <InputLabel>Koltuk Düzeni</InputLabel>
                                    <Select {...field} label="Koltuk Düzeni">
                                        {layouts.map(l => (
                                            <MenuItem key={l.id} value={l.id}>{l.name} ({l.rowCount}x{l.colCount})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </div>

                    <div className="flex gap-4">
                        <Controller name="owner" control={control} render={({ field }) => <TextField {...field} label="Araç Sahibi" fullWidth />} />
                        <Controller name="busPhone" control={control} render={({ field }) => <TextField {...field} label="Araç Telefonu" fullWidth />} />
                    </div>
                    
                    <div className="flex gap-4">
                        <Controller name="taxOffice" control={control} render={({ field }) => <TextField {...field} label="Vergi Dairesi" fullWidth />} />
                        <Controller name="taxNumber" control={control} render={({ field }) => <TextField {...field} label="Vergi No" fullWidth />} />
                    </div>

                    {/* Test Location Section */}
                    <Paper variant="outlined" className="p-3 bg-slate-50 dark:bg-slate-800 border-dashed border-2">
                        <Typography variant="subtitle2" className="mb-2 font-bold color-primary">📍 Canlı Konum Testi</Typography>
                        <div className="flex gap-4">
                            <Controller 
                                name="testLat" 
                                control={control} 
                                render={({ field }) => (
                                    <TextField {...field} label="Latitude (Enlem)" fullWidth type="number" helperText="Örn: 41.0082" />
                                )} 
                            />
                            <Controller 
                                name="testLng" 
                                control={control} 
                                render={({ field }) => (
                                    <TextField {...field} label="Longitude (Boylam)" fullWidth type="number" helperText="Örn: 28.9784" />
                                )} 
                            />
                        </div>
                    </Paper>

                    <Controller
                        name="features"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Autocomplete
                                multiple
                                disablePortal // Fix z-index issue inside Dialog
                                options={busFeatures}
                                getOptionLabel={(option) => option.name}
                                value={busFeatures.filter(f => value?.includes(f.id)) || []}
                                onChange={(_, newValue) => {
                                    onChange(newValue.map(v => v.id));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Dinamik Özellikler" placeholder="Özellik ekle..." />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip 
                                            label={option.name} 
                                            avatar={<Avatar src={`http://localhost:3000${option.iconPath}`} />}
                                            {...getTagProps({ index })} 
                                            key={option.id} 
                                        />
                                    ))
                                }
                            />
                        )}
                    />

				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>İptal</Button>
					<Button onClick={handleSubmit(onSubmit)} variant="contained" color="secondary">
						Kaydet
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default BusesPage;