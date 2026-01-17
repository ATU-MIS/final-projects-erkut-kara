export enum SeatUpdateEventType {
  SEAT_RESERVED = 'seat_reserved',
  SEAT_CONFIRMED = 'seat_confirmed',
  SEAT_SUSPENDED = 'seat_suspended',
  SEAT_CANCELLED = 'seat_cancelled',
  SEAT_AVAILABLE = 'seat_available',
}

export interface SeatUpdatePayload {
  routeId: string;
  seatNumber: number;
  eventType: SeatUpdateEventType;
  ticketId?: string;
  pnrNumber?: string;
  fromStopIndex?: number; // Added for segmented booking awareness
  toStopIndex?: number;   // Added for segmented booking awareness
  timestamp: Date;
  metadata?: {
    fromCity?: string;
    toCity?: string;
    price?: number;
    gender?: string;
  };
}

export class SeatUpdateEvent {
  constructor(public readonly payload: SeatUpdatePayload) {}
}
