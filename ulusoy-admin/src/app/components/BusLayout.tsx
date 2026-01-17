'use client';

import { useState } from 'react';
import { Paper, Button, Popover, Typography, Box } from '@mui/material';
import { EventSeat, MeetingRoom, DirectionsBus } from '@mui/icons-material';

interface SeatProps {
  number: number;
  status: 'AVAILABLE' | 'SOLD_MALE' | 'SOLD_FEMALE' | 'SELECTED';
  onSelect: (gender: 'MALE' | 'FEMALE') => void;
  onDeselect: () => void;
  isCustom?: boolean;
}

const Seat = ({ number, status, onSelect, onDeselect, isCustom }: SeatProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (status === 'AVAILABLE') {
      setAnchorEl(event.currentTarget);
    } else if (status === 'SELECTED') {
      onDeselect();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGenderSelect = (gender: 'MALE' | 'FEMALE') => {
      onSelect(gender);
      handleClose();
  };

  // Styles
  let bgColor = 'white';
  let borderColor = '#cbd5e1'; // slate-300
  let textColor = '#334155'; // slate-700
  
  if (status === 'SOLD_MALE') { bgColor = '#60a5fa'; borderColor = '#3b82f6'; textColor = 'white'; }
  if (status === 'SOLD_FEMALE') { bgColor = '#f472b6'; borderColor = '#d53f8c'; textColor = 'white'; }
  if (status === 'SELECTED') { bgColor = '#48bb78'; borderColor = '#38a169'; textColor = 'white'; }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={status === 'SOLD_MALE' || status === 'SOLD_FEMALE'}
        style={{
            width: isCustom ? '60px' : '50px',
            height: '45px',
            backgroundColor: bgColor,
            border: `2px solid ${borderColor}`,
            color: textColor,
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: (status === 'SOLD_MALE' || status === 'SOLD_FEMALE') ? 'not-allowed' : 'pointer',
            position: 'relative'
        }}
      >
        {number}
      </button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box p={2} display="flex" flexDirection="column" gap={1}>
            <Typography variant="caption" align="center" fontWeight="bold">Koltuk {number}</Typography>
            <Button size="small" variant="contained" sx={{ bgcolor: '#4299e1' }} onClick={() => handleGenderSelect('MALE')}>Bay</Button>
            <Button size="small" variant="contained" sx={{ bgcolor: '#ed64a6' }} onClick={() => handleGenderSelect('FEMALE')}>Bayan</Button>
        </Box>
      </Popover>
    </>
  );
};

interface BusLayoutProps {
  layoutType?: 'LAYOUT_2_1' | 'LAYOUT_2_2';
  customLayout?: any;
  seatCount: number;
  occupiedSeats: { number: number; gender: 'MALE' | 'FEMALE' }[];
  selectedSeats: { number: number; gender: 'MALE' | 'FEMALE' }[];
  onSeatSelect: (seat: { number: number; gender: 'MALE' | 'FEMALE' }) => void;
  onSeatDeselect: (seatNumber: number) => void;
}

export function BusLayout({
  layoutType,
  customLayout,
  seatCount,
  occupiedSeats,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
}: BusLayoutProps) {

  // --- Custom Layout Rendering ---
  if (customLayout && customLayout.seats) {
      const { colCount, seats } = customLayout;
      
      return (
        <div className="bg-slate-50 p-6 pl-24 pr-10 rounded-[3rem] border-4 border-slate-300 inline-block relative shadow-xl min-w-[600px] overflow-x-auto">
            {/* Front of Bus */}
            <div className="absolute top-0 bottom-0 left-0 w-24 bg-white rounded-l-[2.5rem] border-r-4 border-slate-300 flex flex-col justify-center items-center py-8 overflow-hidden shadow-inner z-0">
                <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider -rotate-90">Kaptan</span>
            </div>

            <div 
                className="grid gap-x-2 gap-y-2 relative z-10 pl-4"
                style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${colCount}, 45px)`,
                    gridAutoFlow: 'column', 
                }}
            >
                {(seats as any[]).map((cell) => {
                    if (cell.type === 'EMPTY' || cell.type === 'CORRIDOR') {
                        return <div key={cell.id} style={{ width: '60px', height: '45px' }} />;
                    }
                    if (cell.type === 'DOOR') {
                        return (
                            <div key={cell.id} style={{ width: '60px', height: '45px', backgroundColor: '#fef3c7', border: '1px solid #fde047', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '10px', fontWeight: 'bold' }}>KAPI</span>
                            </div>
                        );
                    }
                    if (cell.type === 'DRIVER') {
                        return <div key={cell.id} style={{ width: '60px', height: '45px' }} />; 
                    }

                    const isOccupied = occupiedSeats.find((s) => s.number === cell.seatNo);
                    const isSelected = selectedSeats.find((s) => s.number === cell.seatNo);

                    let status: SeatProps['status'] = 'AVAILABLE';
                    if (isOccupied) status = isOccupied.gender === 'MALE' ? 'SOLD_MALE' : 'SOLD_FEMALE';
                    if (isSelected) status = 'SELECTED';

                    return (
                        <Seat
                            key={cell.id}
                            number={cell.seatNo}
                            status={status}
                            onSelect={(gender) => onSeatSelect({ number: cell.seatNo, gender })}
                            onDeselect={() => onSeatDeselect(cell.seatNo)}
                            isCustom
                        />
                    );
                })}
            </div>
        </div>
      );
  }

  // --- Legacy Layout ---
  const renderLayout = () => {
    const rows = Math.ceil(seatCount / (layoutType === 'LAYOUT_2_1' ? 3 : 4));
    const layout = [];
    let currentSeat = 1;

    for (let r = 0; r < rows; r++) {
      const rowSeats = [];
      if (layoutType === 'LAYOUT_2_1') {
        for (let i = 0; i < 2; i++) if (currentSeat <= seatCount) rowSeats.push(currentSeat++);
        rowSeats.push(null); 
        if (currentSeat <= seatCount) rowSeats.push(currentSeat++);
      } else {
        for (let i = 0; i < 2; i++) if (currentSeat <= seatCount) rowSeats.push(currentSeat++);
        rowSeats.push(null);
        for (let i = 0; i < 2; i++) if (currentSeat <= seatCount) rowSeats.push(currentSeat++);
      }
      layout.push(rowSeats);
    }
    return layout;
  };

  const grid = renderLayout();

  return (
    <div className="bg-slate-50 p-6 pl-24 pr-10 rounded-[3rem] border-4 border-slate-300 inline-block relative shadow-xl min-w-[600px] overflow-x-auto">
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-white rounded-l-[2.5rem] border-r-4 border-slate-300 flex flex-col justify-center items-center py-8 overflow-hidden shadow-inner z-0">
            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider -rotate-90">Kaptan</span>
        </div>

      <div className="flex flex-col gap-2 relative z-10 pl-4">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((seatNum, colIndex) => {
              if (seatNum === null) return <div key={`gap-${rowIndex}-${colIndex}`} style={{ width: '60px', height: '45px' }} />;
              
              const isOccupied = occupiedSeats.find((s) => s.number === seatNum);
              const isSelected = selectedSeats.find((s) => s.number === seatNum);
              let status: SeatProps['status'] = 'AVAILABLE';
              if (isOccupied) status = isOccupied.gender === 'MALE' ? 'SOLD_MALE' : 'SOLD_FEMALE';
              if (isSelected) status = 'SELECTED';

              return (
                <Seat
                  key={seatNum}
                  number={seatNum}
                  status={status}
                  onSelect={(gender) => onSeatSelect({ number: seatNum, gender })}
                  onDeselect={() => onSeatDeselect(seatNum)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
