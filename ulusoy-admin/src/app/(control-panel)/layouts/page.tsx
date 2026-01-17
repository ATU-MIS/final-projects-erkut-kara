'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
	Button,
	TextField,
	Paper,
	Typography,
	Grid,
	Box,
	ToggleButton,
	ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
	EventSeat,
	MeetingRoom,
	Delete,
	GridOn,
	Save,
	DirectionsBus,
    Add,
    Edit,
    ArrowBack
} from '@mui/icons-material';
import api from '../../../@auth/api'; // Correct API path

// Schema
const schema = z.object({
	name: z.string().min(2, 'Layout adı zorunlu'),
	rowCount: z.number().min(5).max(20),
	colCount: z.number().min(3).max(6)
});

type SeatType = 'SEAT' | 'CORRIDOR' | 'DOOR' | 'DRIVER' | 'EMPTY';

interface SeatCell {
	id: string;
	x: number;
	y: number;
	type: SeatType;
	seatNo?: number;
}

function LayoutsPage() {
    const [view, setView] = useState<'LIST' | 'EDITOR'>('LIST');
    const [layouts, setLayouts] = useState<any[]>([]);
    const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

    // Editor State
	const [grid, setGrid] = useState<SeatCell[]>([]);
	const [selectedTool, setSelectedTool] = useState<SeatType>('SEAT');
	const [rowCount, setRowCount] = useState(12);
	const [colCount, setColCount] = useState(5);
    
    // Seat Number Dialog State
    const [seatDialogOpen, setSeatDialogOpen] = useState(false);
    const [currentCell, setCurrentCell] = useState<SeatCell | null>(null);
    const [seatNoInput, setSeatNoInput] = useState('');

	const { control, handleSubmit, reset, setValue } = useForm({
		defaultValues: {
			name: '',
			rowCount: 12,
			colCount: 5
		},
		resolver: zodResolver(schema)
	});

    // Fetch Layouts
    const fetchLayouts = async () => {
        try {
            const { data } = await api.get('/seat-layouts');
            setLayouts(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (view === 'LIST') fetchLayouts();
    }, [view]);

    // Initialize Grid (Only for new)
    const initGrid = (rows: number, cols: number) => {
        const newGrid: SeatCell[] = [];
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				let type: SeatType = 'SEAT';
				if (cols === 5 && c === 2) type = 'CORRIDOR';
				if (cols === 4 && c === 2) type = 'CORRIDOR';

				newGrid.push({
					id: `${r}-${c}`,
					x: r,
					y: c,
					type,
					seatNo: type === 'SEAT' ? 0 : undefined
				});
			}
		}
        setGrid(newGrid);
    };

    const handleCreateNew = () => {
        setCurrentLayoutId(null);
        reset({ name: '', rowCount: 12, colCount: 5 });
        setRowCount(12);
        setColCount(5);
        initGrid(12, 5);
        setView('EDITOR');
    };

    const handleEdit = (layout: any) => {
        setCurrentLayoutId(layout.id);
        setValue('name', layout.name);
        setValue('rowCount', layout.rowCount);
        setValue('colCount', layout.colCount);
        setRowCount(layout.rowCount);
        setColCount(layout.colCount);
        // Load existing grid/seats
        // Backend returns seats as Json, need to parse/cast
        setGrid(layout.seats as SeatCell[]);
        setView('EDITOR');
    };

    // Grid Dimensions Change
    useEffect(() => {
        if (currentLayoutId) return; // Don't reset grid if editing existing (unless explicit reset needed)
        // initGrid(rowCount, colCount); // This resets grid on dimension change. Maybe keep cells?
        // Keeping it simple: Reset for now.
        initGrid(rowCount, colCount);
    }, [rowCount, colCount, currentLayoutId]);


	const handleCellClick = (cell: SeatCell) => {
        if (selectedTool === 'SEAT') {
            setCurrentCell(cell);
            setSeatNoInput(cell.seatNo?.toString() || '');
            setSeatDialogOpen(true);
        } else {
            // Directly apply other tools
            updateGrid(cell, selectedTool, undefined);
        }
	};

    const handleSeatDialogSave = () => {
        if (currentCell) {
            updateGrid(currentCell, 'SEAT', parseInt(seatNoInput));
        }
        setSeatDialogOpen(false);
    };

    const updateGrid = (cell: SeatCell, type: SeatType, seatNo?: number) => {
        const newGrid = [...grid];
		const targetIndex = newGrid.findIndex(c => c.id === cell.id);
		
		if (targetIndex !== -1) {
			newGrid[targetIndex] = {
                ...newGrid[targetIndex],
                type,
                seatNo: type === 'SEAT' ? seatNo : undefined
            };
			setGrid(newGrid);
		}
    }

	const onSubmit = async (data: any) => {
		try {
			const payload = {
				name: data.name,
				rowCount,
				colCount,
				seats: grid
			};
			
            if (currentLayoutId) {
                // Update endpoint usually PATCH /seat-layouts/:id
                // Assuming backend supports it or create new
                // For MVP, create new works, but update is better.
                // NOTE: SeatLayoutService needs update method. Assuming it exists or using create.
                alert('Güncelleme henüz backendde aktif değil, yeni olarak kaydedilecek.');
                await api.post('/seat-layouts', payload);
            } else {
			    await api.post('/seat-layouts', payload);
            }
			
            alert('Layout kaydedildi!');
            setView('LIST');
		} catch (error) {
			console.error(error);
			alert('Kaydetme hatası');
		}
	};

    if (view === 'LIST') {
        return (
            <div className="flex w-full flex-col p-6 gap-6">
                <div className="flex items-center justify-between">
                    <Typography variant="h4" className="font-bold">Koltuk Düzenleri</Typography>
                    <Button variant="contained" color="secondary" startIcon={<Add />} onClick={handleCreateNew}>
                        Yeni Düzen
                    </Button>
                </div>
                <Paper className="w-full">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Adı</TableCell>
                                <TableCell>Boyut</TableCell>
                                <TableCell align="right">İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {layouts.map((layout) => (
                                <TableRow key={layout.id}>
                                    <TableCell>{layout.name}</TableCell>
                                    <TableCell>{layout.rowCount} x {layout.colCount}</TableCell>
                                    <TableCell align="right">
                                        <Button startIcon={<Edit />} onClick={() => handleEdit(layout)}>Düzenle</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </div>
        );
    }

	return (
		<div className="flex w-full flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button startIcon={<ArrowBack />} onClick={() => setView('LIST')}>Geri</Button>
				    <Typography variant="h4" className="font-bold">Düzen Editörü</Typography>
                </div>
				<Button
					variant="contained"
					color="secondary"
					startIcon={<Save />}
					onClick={handleSubmit(onSubmit)}
				>
					Kaydet
				</Button>
			</div>

			<Grid container spacing={4}>
				{/* Settings Panel */}
				<Grid item xs={12} md={3}>
					<Paper className="p-4 flex flex-col gap-4 sticky top-6">
						<Typography variant="h6">Ayarlar</Typography>
						
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextField {...field} label="Layout Adı" fullWidth required />
							)}
						/>

						<div className="flex gap-4">
							<TextField 
								label="Sıra" 
								type="number" 
								value={rowCount} 
								onChange={(e) => setRowCount(parseInt(e.target.value))} 
								fullWidth 
                                disabled={!!currentLayoutId} // Disable dimensions on edit to prevent grid break
							/>
							<TextField 
								label="Sütun" 
								type="number" 
								value={colCount} 
								onChange={(e) => setColCount(parseInt(e.target.value))} 
								fullWidth 
                                disabled={!!currentLayoutId}
							/>
						</div>

						<Typography variant="subtitle2" className="mt-4">Araçlar</Typography>
						<ToggleButtonGroup
							value={selectedTool}
							exclusive
							onChange={(e, val) => val && setSelectedTool(val)}
							orientation="vertical"
							fullWidth
						>
							<ToggleButton value="SEAT" className="justify-start gap-2">
								<EventSeat /> Koltuk (No Gir)
							</ToggleButton>
							<ToggleButton value="CORRIDOR" className="justify-start gap-2">
								<GridOn /> Koridor
							</ToggleButton>
							<ToggleButton value="DOOR" className="justify-start gap-2">
								<MeetingRoom /> Kapı
							</ToggleButton>
							<ToggleButton value="DRIVER" className="justify-start gap-2">
								<DirectionsBus /> Şoför
							</ToggleButton>
							<ToggleButton value="EMPTY" className="justify-start gap-2">
								<Delete /> Boşluk / Sil
							</ToggleButton>
						</ToggleButtonGroup>
					</Paper>
				</Grid>

				{/* Visual Editor (Bus View - Horizontal) */}
				<Grid item xs={12} md={9}>
					<Paper className="p-8 bg-slate-50 min-h-[400px] overflow-auto flex justify-start items-center">
						<div 
							className="grid gap-3 p-6 pl-24 pr-10 bg-white rounded-[3rem] border border-slate-300 relative shadow-xl"
							style={{
                                display: 'grid',
                                gridTemplateRows: `repeat(${colCount}, 48px)`, // Height based on seat config
                                gridAutoFlow: 'column', 
                                width: 'fit-content'
							}}
						>
							{/* Front of Bus (Left) */}
							<div className="absolute top-0 bottom-0 left-0 w-24 bg-slate-50 rounded-l-[2.5rem] border-r border-slate-200 flex flex-col justify-center items-center py-8 overflow-hidden shadow-inner z-0">
                                {/* Windshield */}
                                <div className="absolute left-0 top-4 bottom-4 w-3 bg-slate-200 rounded-l-full opacity-60"></div>
                                {/* Steering Wheel (Simple SVG) */}
								<div className="mt-12 p-3 bg-white rounded-full text-slate-400 border border-slate-200 shadow-sm">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 transform -rotate-90">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 2v20" />
                                        <path d="M2 12h20" />
                                        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
                                    </svg>
								</div>
								<span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider -rotate-90">Kaptan</span>
							</div>

							{grid.map((cell) => (
								<div
									key={cell.id}
									onClick={() => handleCellClick(cell)}
									className={`
										w-[60px] h-[48px] flex items-center justify-center rounded-md cursor-pointer transition-all hover:scale-105 border-2 relative font-bold text-sm
										${cell.type === 'SEAT' ? 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 hover:shadow-md' : ''}
										${cell.type === 'CORRIDOR' ? 'bg-slate-50 border-slate-200 opacity-50 hover:opacity-100' : ''}
										${cell.type === 'DOOR' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : ''}
										${cell.type === 'DRIVER' ? 'bg-gray-800 text-white' : ''}
										${cell.type === 'EMPTY' ? 'bg-transparent border-dashed border-slate-200 hover:bg-slate-50' : ''}
									`}
								>
									{cell.type === 'SEAT' && (
										<span>{cell.seatNo}</span>
									)}
									{cell.type === 'DOOR' && (
                                        <div className="text-[10px] font-bold writing-vertical-lr transform rotate-180">KAPI</div>
                                    )}
								</div>
							))}
						</div>
					</Paper>
				</Grid>
			</Grid>

            {/* Seat Number Dialog */}
            <Dialog open={seatDialogOpen} onClose={() => setSeatDialogOpen(false)}>
                <DialogTitle>Koltuk Numarası</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus
                        margin="dense"
                        label="Numara"
                        type="number"
                        fullWidth
                        value={seatNoInput}
                        onChange={(e) => setSeatNoInput(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSeatDialogOpen(false)}>İptal</Button>
                    <Button onClick={handleSeatDialogSave} variant="contained">Tamam</Button>
                </DialogActions>
            </Dialog>
		</div>
	);
}

export default LayoutsPage;