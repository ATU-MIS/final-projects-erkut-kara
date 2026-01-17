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
    IconButton,
    Avatar
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../../../@auth/api';

const schema = z.object({
	name: z.string().min(2, 'Özellik adı zorunlu'),
	description: z.string().optional(),
    iconPath: z.string().min(1, 'İkon seçimi zorunlu')
});

function BusFeaturesPage() {
	const [features, setFeatures] = useState<any[]>([]);
    const [icons, setIcons] = useState<string[]>([]);
	const [open, setOpen] = useState(false);
	const [editingFeature, setEditingFeature] = useState<any>(null);

	const { control, handleSubmit, reset, setValue, watch } = useForm({
		defaultValues: {
			name: '',
			description: '',
            iconPath: ''
		},
		resolver: zodResolver(schema)
	});

    const selectedIcon = watch('iconPath');

	const fetchData = async () => {
		try {
			const { data } = await api.get('/bus-features');
			setFeatures(data);
		} catch (error) {
			console.error(error);
		}
	};

    const fetchIcons = async () => {
        try {
            const { data } = await api.get('/bus-features/icons');
            setIcons(data);
        } catch (error) {
            console.error(error);
        }
    };

	useEffect(() => {
		fetchData();
        fetchIcons();
	}, []);

	const handleOpen = (feature?: any) => {
		if (feature) {
			setEditingFeature(feature);
			setValue('name', feature.name);
			setValue('description', feature.description);
            setValue('iconPath', feature.iconPath);
		} else {
			setEditingFeature(null);
			reset({ name: '', description: '', iconPath: '' });
		}
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		reset();
	};

	const onSubmit = async (data: any) => {
		try {
			if (editingFeature) {
				await api.patch(`/bus-features/${editingFeature.id}`, data);
			} else {
				await api.post('/bus-features', data);
			}
			fetchData();
			handleClose();
		} catch (error: any) {
			console.error(error);
            alert('Hata oluştu');
		}
	};

    const handleDelete = async (id: string) => {
        if(confirm('Silmek istediğinize emin misiniz?')) {
            await api.delete(`/bus-features/${id}`);
            fetchData();
        }
    };

	return (
		<div className="flex w-full flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<Typography variant="h4" className="font-bold">Otobüs Özellikleri</Typography>
				<Button
					variant="contained"
					color="secondary"
					startIcon={<Add />}
					onClick={() => handleOpen()}
				>
					Yeni Özellik
				</Button>
			</div>

			<Paper className="w-full overflow-hidden">
				<Table>
					<TableHead>
						<TableRow>
                            <TableCell>İkon</TableCell>
							<TableCell>Özellik Adı</TableCell>
							<TableCell>Açıklama</TableCell>
							<TableCell align="right">İşlemler</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{features.map((feature) => (
							<TableRow key={feature.id} hover>
                                <TableCell>
                                    <Avatar src={`http://localhost:3000${feature.iconPath}`} variant="rounded" sx={{ bgcolor: 'transparent', width: 32, height: 32 }} />
                                </TableCell>
								<TableCell className="font-medium">{feature.name}</TableCell>
								<TableCell>{feature.description}</TableCell>
								<TableCell align="right">
									<IconButton onClick={() => handleOpen(feature)} color="primary"><Edit /></IconButton>
                                    <IconButton onClick={() => handleDelete(feature.id)} color="error"><Delete /></IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>

			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle>{editingFeature ? 'Özelliği Düzenle' : 'Yeni Özellik'}</DialogTitle>
				<DialogContent className="pt-4 flex flex-col gap-4">
                    <Controller name="name" control={control} render={({ field }) => (<TextField {...field} label="Özellik Adı" fullWidth required />)} />
                    <Controller name="description" control={control} render={({ field }) => (<TextField {...field} label="Açıklama" fullWidth />)} />
                    
                    <div>
                        <Typography variant="caption" className="mb-2 block">İkon Seçiniz</Typography>
                        <div className="grid grid-cols-6 gap-2 border p-2 rounded max-h-40 overflow-y-auto">
                            {icons.map((icon) => (
                                <div 
                                    key={icon} 
                                    onClick={() => setValue('iconPath', icon)}
                                    className={`cursor-pointer p-1 rounded hover:bg-slate-100 flex items-center justify-center border-2 ${selectedIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                                >
                                    <img src={`http://localhost:3000${icon}`} alt="icon" className="w-8 h-8 object-contain" />
                                </div>
                            ))}
                        </div>
                        {control._formState.errors.iconPath && <Typography color="error" variant="caption">İkon seçimi zorunludur</Typography>}
                    </div>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>İptal</Button>
					<Button onClick={handleSubmit(onSubmit)} variant="contained" color="secondary">Kaydet</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default BusFeaturesPage;
