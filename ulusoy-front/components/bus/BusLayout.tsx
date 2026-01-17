"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SeatProps {
  number: number;
  status: "AVAILABLE" | "SOLD_MALE" | "SOLD_FEMALE" | "SELECTED";
  onSelect: (gender: "MALE" | "FEMALE") => void;
  onDeselect: () => void;
  isCustom?: boolean;
}

const Seat = ({ number, status, onSelect, onDeselect, isCustom }: SeatProps) => {
  const [open, setOpen] = useState(false);

  // Colors matching Varan/Ulusoy style
  const seatColor = {
    AVAILABLE: "bg-white border-2 border-slate-300 text-slate-600 hover:border-blue-500 hover:shadow-md",
    SOLD_MALE: "bg-blue-400 border-2 border-blue-500 text-white cursor-not-allowed",
    SOLD_FEMALE: "bg-pink-400 border-2 border-pink-500 text-white cursor-not-allowed",
    SELECTED: "bg-green-500 border-2 border-green-600 text-white hover:bg-green-600",
  };

  const handleClick = () => {
    if (status === "AVAILABLE") {
      setOpen(true);
    } else if (status === "SELECTED") {
      onDeselect();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={handleClick}
          disabled={status === "SOLD_MALE" || status === "SOLD_FEMALE"}
          className={cn(
            "flex items-center justify-center font-bold text-sm transition-all duration-200 rounded-lg shadow-sm relative",
            isCustom ? "w-[50px] h-[45px]" : "w-[50px] h-[45px]",
            seatColor[status]
          )}
        >
          <span className="z-10">{number}</span>
          {/* Headrest visual */}
          <div className="absolute top-1 bottom-1 -right-1 w-1 bg-black/10 rounded-r-sm" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2">
        <div className="grid gap-2">
          <p className="text-xs font-semibold text-center text-slate-500">Koltuk {number}</p>
          <Button 
            size="sm" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => { onSelect("MALE"); setOpen(false); }}
          >
            Bay
          </Button>
          <Button 
            size="sm" 
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            onClick={() => { onSelect("FEMALE"); setOpen(false); }}
          >
            Bayan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface BusLayoutProps {
  layoutType?: "LAYOUT_2_1" | "LAYOUT_2_2";
  customLayout?: any;
  seatCount: number;
  occupiedSeats: { number: number; gender: "MALE" | "FEMALE" }[];
  selectedSeats: { number: number; gender: "MALE" | "FEMALE" }[];
  onSeatSelect: (seat: { number: number; gender: "MALE" | "FEMALE" }) => void;
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
        <div className="bg-slate-100 p-6 pl-24 pr-10 rounded-[3rem] border-4 border-slate-300 inline-block relative shadow-xl min-w-[600px] overflow-x-auto">
            {/* Front of Bus */}
            <div className="absolute top-0 bottom-0 left-0 w-24 bg-white rounded-l-[2.5rem] border-r-4 border-slate-300 flex flex-col justify-center items-center py-8 overflow-hidden shadow-inner z-0">
                <div className="absolute left-0 top-4 bottom-4 w-3 bg-slate-200 rounded-l-full opacity-60"></div>
                {/* Steering Wheel SVG */}
                <div className="mt-12 p-3 bg-slate-50 rounded-full border-2 border-slate-200 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-slate-400 transform -rotate-90">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2v20" />
                        <path d="M2 12h20" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider -rotate-90">Kaptan</span>
            </div>

            <div 
                className="grid gap-x-3 gap-y-3 relative z-10 pl-4"
                style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${colCount}, 45px)`,
                    gridAutoFlow: 'column', 
                }}
            >
                {(seats as any[]).map((cell) => {
                    if (cell.type === 'EMPTY' || cell.type === 'CORRIDOR') {
                        return <div key={cell.id} className="w-[50px] h-[45px]" />;
                    }
                    if (cell.type === 'DOOR') {
                        return (
                            <div key={cell.id} className="w-[50px] h-[45px] flex items-center justify-center bg-yellow-50 rounded border border-yellow-200">
                                <span className="text-[10px] font-bold text-yellow-600 writing-vertical-lr transform rotate-180">KAPI</span>
                            </div>
                        );
                    }
                    if (cell.type === 'DRIVER') {
                        return <div key={cell.id} className="w-[50px] h-[45px]" />; 
                    }

                    const isOccupied = occupiedSeats.find((s) => s.number === cell.seatNo);
                    const isSelected = selectedSeats.find((s) => s.number === cell.seatNo);

                    let status: SeatProps["status"] = "AVAILABLE";
                    if (isOccupied) status = isOccupied.gender === "MALE" ? "SOLD_MALE" : "SOLD_FEMALE";
                    if (isSelected) status = "SELECTED";

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

  // --- Legacy Layout Fallback ---
  const renderLayout = () => {
    const rows = Math.ceil(seatCount / (layoutType === "LAYOUT_2_1" ? 3 : 4));
    const layout = [];
    let currentSeat = 1;

    for (let r = 0; r < rows; r++) {
      const rowSeats = [];
      if (layoutType === "LAYOUT_2_1") {
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
    <div className="bg-slate-100 p-6 pl-24 pr-10 rounded-[3rem] border-4 border-slate-300 inline-block relative shadow-xl min-w-[600px] overflow-x-auto">
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-white rounded-l-[2.5rem] border-r-4 border-slate-300 flex flex-col justify-center items-center py-8 overflow-hidden shadow-inner z-0">
            <div className="absolute left-0 top-4 bottom-4 w-3 bg-slate-200 rounded-l-full opacity-60"></div>
            <div className="mt-12 p-3 bg-slate-50 rounded-full border-2 border-slate-200 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-slate-400 transform -rotate-90">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v20" />
                    <path d="M2 12h20" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
                </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider -rotate-90">Kaptan</span>
        </div>

      <div className="flex flex-col gap-3 relative z-10 pl-4">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3">
            {row.map((seatNum, colIndex) => {
              if (seatNum === null) return <div key={`gap-${rowIndex}-${colIndex}`} className="w-[50px] h-[45px]" />;
              
              const isOccupied = occupiedSeats.find((s) => s.number === seatNum);
              const isSelected = selectedSeats.find((s) => s.number === seatNum);
              let status: SeatProps["status"] = "AVAILABLE";
              if (isOccupied) status = isOccupied.gender === "MALE" ? "SOLD_MALE" : "SOLD_FEMALE";
              if (isSelected) status = "SELECTED";

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
