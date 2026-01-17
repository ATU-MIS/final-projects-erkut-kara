'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
    IconButton,
    Chip,
    TablePagination
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../../../@auth/api';

const schema = z.object({
	name: z.string().min(2, 'Durak adı zorunlu'),
	type: z.enum(['CITY', 'REST_FACILITY', 'TERMINAL'])
});

function StationsPage() {
	const [stations, setStations] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [editingStation, setEditingStation] = useState<any>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

	const { control, handleSubmit, reset, setValue } = useForm({
		defaultValues: {
			name: '',
			type: 'CITY'
		},
		resolver: zodResolver(schema)
	});

	const fetchData = async () => {
		try {
			const { data } = await api.get('/stations');
			setStations(data);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleOpen = (station?: any) => {
		if (station) {
			setEditingStation(station);
			setValue('name', station.name);
			setValue('type', station.type);
		} else {
			setEditingStation(null);
			reset({ name: '', type: 'CITY' });
		}
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		reset();
	};

	const onSubmit = async (data: any) => {
		try {
			if (editingStation) {
				await api.patch(`/stations/${editingStation.id}`, data);
			} else {
				await api.post('/stations', data);
			}
			fetchData();
			handleClose();
		} catch (error: any) {
			console.error(error);
            alert(error.response?.data?.message || 'Hata oluştu');
		}
	};

    const handleDelete = async (id: string) => {
        if(confirm('Silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/stations/${id}`);
                fetchData();
            } catch (error: any) {
                alert(error.response?.data?.message || 'Silinemedi');
            }
        }
    };

    const paginatedStations = stations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<div className="flex w-full flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<Typography variant="h4" className="font-bold">Durak Yönetimi</Typography>
				<Button variant="contained" color="secondary" startIcon={<Add />} onClick={() => handleOpen()}>Yeni Durak</Button>
			</div>
			<Paper className="w-full overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Durak Adı</TableCell>
							<TableCell>Tipi</TableCell>
							<TableCell align="right">İşlemler</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedStations.map((station) => (
							<TableRow key={station.id} hover>
								<TableCell className="font-medium">{station.name}</TableCell>
								<TableCell>
                                    <Chip label={station.type === 'CITY' ? 'ŞEHİR' : station.type === 'REST_FACILITY' ? 'TESİS' : 'OTOGAR'} color={station.type === 'REST_FACILITY' ? 'warning' : 'primary'} size="small" variant="outlined" />
                                </TableCell>
								<TableCell align="right">
									<IconButton onClick={() => handleOpen(station)} color="primary"><Edit /></IconButton>
                                    <IconButton onClick={() => handleDelete(station.id)} color="error"><Delete /></IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
                </div>
                <TablePagination rowsPerPageOptions={[10, 25, 50, 100]} component="div" count={stations.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Sayfa başına:" />
			</Paper>
			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle>{editingStation ? 'Durağı Düzenle' : 'Yeni Durak'}</DialogTitle>
				<DialogContent className="pt-4 flex flex-col gap-4">
                    <Controller name="name" control={control} render={({ field }) => (<TextField {...field} label="Durak Adı" fullWidth required autoFocus />)} />
                    <Controller name="type" control={control} render={({ field }) => (<FormControl fullWidth><InputLabel>Durak Tipi</InputLabel><Select {...field} label="Durak Tipi"><MenuItem value="CITY">Şehir / İlçe</MenuItem><MenuItem value="REST_FACILITY">Dinlenme Tesisi</MenuItem><MenuItem value="TERMINAL">Otogar</MenuItem></Select></FormControl>)} />
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>İptal</Button>
					<Button onClick={handleSubmit(onSubmit)} variant="contained" color="secondary">Kaydet</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default StationsPage;
