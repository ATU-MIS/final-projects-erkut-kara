# WebSocket Real-Time Seat Updates - Complete Documentation

## Overview

The WebSocket Gateway provides real-time seat availability updates when tickets are reserved, confirmed, suspended, or cancelled. Clients can subscribe to specific routes and receive instant notifications about seat status changes.

## Features

- ✅ **Real-Time Updates** - Instant notifications for seat changes
- ✅ **Route Subscription** - Subscribe to specific routes
- ✅ **Event Types** - Reserved, Confirmed, Suspended, Cancelled, Available
- ✅ **Automatic Events** - Events automatically emitted on ticket actions
- ✅ **Connection Management** - Track connected clients per route
- ✅ **CORS Support** - Cross-origin WebSocket connections

## WebSocket Connection

### Endpoint
```
ws://localhost:3000/seats
```

### Namespace
```
/seats
```

## Client Connection

### Using Socket.IO Client

**Installation:**
```bash
npm install socket.io-client
```

**Basic Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/seats', {
  transports: ['websocket'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Client Events (Emit)

### 1. Subscribe to Route Updates

Subscribe to receive seat updates for a specific route:

```javascript
socket.emit('subscribe_route', { 
  routeId: 'route-uuid-here' 
});

// Listen for confirmation
socket.on('subscribed', (data) => {
  console.log('Subscribed to route:', data);
  // Output: { routeId: 'route-uuid', message: 'Successfully subscribed...' }
});
```

### 2. Unsubscribe from Route Updates

Stop receiving updates for a route:

```javascript
socket.emit('unsubscribe_route', { 
  routeId: 'route-uuid-here' 
});

// Listen for confirmation
socket.on('unsubscribed', (data) => {
  console.log('Unsubscribed from route:', data);
  // Output: { routeId: 'route-uuid', message: 'Successfully unsubscribed...' }
});
```

### 3. Get Seat Availability

Request current seat availability (optional):

```javascript
socket.emit('get_seat_availability', { 
  routeId: 'route-uuid-here' 
});

socket.on('availability_request_received', (data) => {
  console.log('Request received:', data);
});
```

## Server Events (Listen)

### 1. Seat Update Event

Main event for all seat status changes:

```javascript
socket.on('seat_update', (payload) => {
  console.log('Seat update received:', payload);
  
  // Handle different event types
  switch (payload.eventType) {
    case 'seat_reserved':
      console.log(`Seat ${payload.seatNumber} reserved`);
      break;
    case 'seat_confirmed':
      console.log(`Seat ${payload.seatNumber} confirmed (paid)`);
      break;
    case 'seat_suspended':
      console.log(`Seat ${payload.seatNumber} suspended`);
      break;
    case 'seat_cancelled':
      console.log(`Seat ${payload.seatNumber} cancelled`);
      break;
    case 'seat_available':
      console.log(`Seat ${payload.seatNumber} now available`);
      break;
  }
});
```

**Payload Structure:**
```typescript
{
  routeId: string;           // Route UUID
  seatNumber: number;        // Seat number (1-based)
  eventType: 'seat_reserved' | 'seat_confirmed' | 'seat_suspended' | 'seat_cancelled' | 'seat_available';
  ticketId?: string;         // Ticket UUID (if applicable)
  pnrNumber?: string;        // PNR code (if applicable)
  fromStopIndex?: number;    // Departure stop index (e.g. 0)
  toStopIndex?: number;      // Arrival stop index (e.g. 2)
  timestamp: Date;           // Event timestamp
  metadata?: {
    fromCity?: string;
    toCity?: string;
    price?: number;
    gender?: string;
  };
}
```

### Segmented Booking Handling (Frontend Logic)

Since tickets are sold for specific segments (e.g., Stop 0 to Stop 2), a "seat_reserved" event does not necessarily mean the seat is unavailable for everyone.

**Frontend Check:**
When receiving an event, check if it overlaps with the user's current search segment.

```javascript
// User is searching for ticket from Stop A (index: userFromIndex) to Stop B (index: userToIndex)
socket.on('seat_update', (payload) => {
  if (payload.fromStopIndex !== undefined && payload.toStopIndex !== undefined) {
    // Check overlap: (EventStart < UserEnd) AND (EventEnd > UserStart)
    const isRelevant = (payload.fromStopIndex < userToIndex) && (payload.toStopIndex > userFromIndex);
    
    if (!isRelevant) {
      console.log('Seat update ignored (no overlap with current segment)');
      return; // Do not update UI
    }
  }
  
  // Proceed to update seat map...
});
```

## Event Types

### 1. SEAT_RESERVED
Emitted when a user books a ticket (status: RESERVED)

**When:** `POST /tickets` succeeds

**Example Payload:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "seatNumber": 15,
  "eventType": "seat_reserved",
  "ticketId": "660e8400-e29b-41d4-a716-446655440001",
  "pnrNumber": "ABC123",
  "timestamp": "2025-10-14T10:30:00.000Z",
  "metadata": {
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "price": 150.00,
    "gender": "MALE"
  }
}
```

### 2. SEAT_CONFIRMED
Emitted when a ticket is confirmed (usually after payment)

**When:** 
- `POST /payments` succeeds
- `PUT /tickets/:id/confirm` succeeds

**Example Payload:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "seatNumber": 15,
  "eventType": "seat_confirmed",
  "ticketId": "660e8400-e29b-41d4-a716-446655440001",
  "pnrNumber": "ABC123",
  "timestamp": "2025-10-14T10:35:00.000Z",
  "metadata": {
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "price": 150.00
  }
}
```

### 3. SEAT_SUSPENDED
Emitted when a ticket is suspended by admin/agent

**When:** `PUT /tickets/:id/suspend` succeeds

**Example Payload:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "seatNumber": 15,
  "eventType": "seat_suspended",
  "ticketId": "660e8400-e29b-41d4-a716-446655440001",
  "pnrNumber": "ABC123",
  "timestamp": "2025-10-14T11:00:00.000Z",
  "metadata": {
    "fromCity": "Istanbul",
    "toCity": "Ankara"
  }
}
```

### 4. SEAT_CANCELLED
Emitted when a ticket is cancelled

**When:** `DELETE /tickets/:id` succeeds

**Example Payload:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "seatNumber": 15,
  "eventType": "seat_cancelled",
  "ticketId": "660e8400-e29b-41d4-a716-446655440001",
  "pnrNumber": "ABC123",
  "timestamp": "2025-10-14T12:00:00.000Z",
  "metadata": {
    "fromCity": "Istanbul",
    "toCity": "Ankara"
  }
}
```

### 5. SEAT_AVAILABLE
Emitted when a seat becomes available again (after cancellation)

**When:** `DELETE /tickets/:id` succeeds (emitted right after SEAT_CANCELLED)

**Example Payload:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "seatNumber": 15,
  "eventType": "seat_available",
  "timestamp": "2025-10-14T12:00:00.000Z",
  "metadata": {
    "fromCity": "Istanbul",
    "toCity": "Ankara"
  }
}
```

## Complete Client Example

### React Component

```jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

function SeatMap({ routeId }) {
  const [socket, setSocket] = useState(null);
  const [seats, setSeats] = useState({}); // { seatNumber: status }

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000/seats', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      
      // Subscribe to route updates
      newSocket.emit('subscribe_route', { routeId });
    });

    newSocket.on('subscribed', (data) => {
      console.log('Subscribed:', data);
    });

    // Listen for seat updates
    newSocket.on('seat_update', (payload) => {
      console.log('Seat update:', payload);
      
      setSeats((prev) => ({
        ...prev,
        [payload.seatNumber]: payload.eventType,
      }));

      // Show notification
      showNotification(payload);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe_route', { routeId });
        newSocket.disconnect();
      }
    };
  }, [routeId]);

  const showNotification = (payload) => {
    const messages = {
      seat_reserved: `Seat ${payload.seatNumber} has been reserved`,
      seat_confirmed: `Seat ${payload.seatNumber} has been confirmed`,
      seat_suspended: `Seat ${payload.seatNumber} has been suspended`,
      seat_cancelled: `Seat ${payload.seatNumber} has been cancelled`,
      seat_available: `Seat ${payload.seatNumber} is now available!`,
    };

    alert(messages[payload.eventType] || 'Seat update received');
  };

  const getSeatColor = (status) => {
    const colors = {
      seat_reserved: 'orange',
      seat_confirmed: 'red',
      seat_suspended: 'gray',
      seat_cancelled: 'yellow',
      seat_available: 'green',
    };
    return colors[status] || 'white';
  };

  return (
    <div>
      <h2>Seat Map (Real-time)</h2>
      <div className="seat-map">
        {Object.entries(seats).map(([seatNumber, status]) => (
          <div
            key={seatNumber}
            className="seat"
            style={{
              backgroundColor: getSeatColor(status),
              padding: '10px',
              margin: '5px',
              display: 'inline-block',
            }}
          >
            Seat {seatNumber}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeatMap;
```

### Vanilla JavaScript

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000/seats');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Subscribe to a route
  socket.emit('subscribe_route', { 
    routeId: '550e8400-e29b-41d4-a716-446655440000' 
  });
});

// Handle seat updates
socket.on('seat_update', (payload) => {
  console.log('Seat update:', payload);
  
  // Update UI
  const seatElement = document.getElementById(`seat-${payload.seatNumber}`);
  if (seatElement) {
    seatElement.className = `seat ${payload.eventType}`;
    seatElement.textContent = `Seat ${payload.seatNumber}`;
  }
  
  // Show notification
  showToast(
    `Seat ${payload.seatNumber} ${payload.eventType.replace('seat_', '')}`
  );
});

// Handle errors
socket.on('error', (error) => {
  console.error('Error:', error);
});

// Unsubscribe when leaving page
window.addEventListener('beforeunload', () => {
  socket.emit('unsubscribe_route', { 
    routeId: '550e8400-e29b-41d4-a716-446655440000' 
  });
  socket.disconnect();
});
```

## Backend Integration

### Automatic Event Emission

Events are automatically emitted by the [`TicketService`](c:\Users\crazy\OneDrive\Masaüstü\ulusoy\src\modules\ticket\ticket.service.ts):

**When a ticket is created:**
```typescript
// In ticket.service.ts - create()
this.ticketGateway.emitSeatReserved(
  new SeatUpdateEvent({
    routeId: ticket.routeId,
    seatNumber: ticket.seatNumber,
    eventType: SeatUpdateEventType.SEAT_RESERVED,
    ticketId: ticket.id,
    pnrNumber: ticket.pnrNumber,
    timestamp: new Date(),
    metadata: { ... },
  })
);
```

**When a payment is successful:**
```typescript
// In payment.service.ts - processPayment()
this.ticketGateway.emitSeatConfirmed(
  new SeatUpdateEvent({
    routeId: ticket.routeId,
    seatNumber: ticket.seatNumber,
    eventType: SeatUpdateEventType.SEAT_CONFIRMED,
    ticketId: ticket.id,
    pnrNumber: ticket.pnrNumber,
    timestamp: new Date(),
    metadata: { ... },
  })
);
```

## Testing

### Test with Browser Console

```javascript
// Connect
const socket = io('http://localhost:3000/seats');

// Subscribe
socket.on('connect', () => {
  socket.emit('subscribe_route', { 
    routeId: 'your-route-id' 
  });
});

// Listen
socket.on('seat_update', console.log);

// Test by booking a ticket via REST API
// You should see the event in the console
```

### Test with Postman

1. Create new WebSocket request
2. Connect to: `ws://localhost:3000/seats`
3. Send message:
```json
{
  "event": "subscribe_route",
  "data": {
    "routeId": "route-uuid"
  }
}
```
4. Book a ticket via REST API
5. Watch for `seat_update` messages

## Connection Statistics

Get statistics about connected clients (for debugging):

```typescript
// In your code
const stats = this.ticketGateway.getConnectionStats();
console.log(stats);

// Output:
{
  totalRoutes: 3,
  routeDetails: [
    { routeId: 'route-1', subscriberCount: 5 },
    { routeId: 'route-2', subscriberCount: 2 },
    { routeId: 'route-3', subscriberCount: 8 }
  ]
}
```

## Architecture

### Flow Diagram

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ ws://localhost:3000/seats
       ▼
┌──────────────┐
│TicketGateway │
│  (WebSocket) │
└──────┬───────┘
       │
       │ Room: route:uuid
       │
       ├─ Client 1 (subscribed)
       ├─ Client 2 (subscribed)
       └─ Client 3 (subscribed)

When ticket action occurs:
┌────────────┐
│   REST API │
│ POST /ticket│
└──────┬─────┘
       │
       ▼
┌────────────┐
│TicketService│
└──────┬─────┘
       │
       │ emitSeatReserved()
       ▼
┌────────────┐
│TicketGateway│
└──────┬─────┘
       │
       │ server.to(room).emit()
       ▼
┌────────────┐
│All Clients │
│in Room     │
└────────────┘
```

## Security Considerations

### Current Implementation
- CORS: Allows all origins (`*`)
- No authentication required

### Production Recommendations

1. **Add JWT Authentication:**
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: '/seats',
})
export class TicketGateway {
  @UseGuards(WsJwtGuard)
  handleConnection(client: Socket) {
    // Validate JWT token
  }
}
```

2. **Restrict CORS:**
```typescript
cors: {
  origin: ['https://yourdomain.com'],
  credentials: true,
}
```

3. **Rate Limiting:**
```typescript
// Add rate limiting for WebSocket connections
```

## Performance

### Optimizations
- ✅ Room-based subscriptions (only relevant clients notified)
- ✅ Automatic cleanup on disconnect
- ✅ No message broadcasting to all clients
- ✅ Minimal payload size

### Scalability
For high-traffic scenarios, consider:
- Redis adapter for multi-server support
- Message queue for event processing
- Connection pooling

### Redis Adapter (Optional)

```typescript
// Install: npm install @socket.io/redis-adapter redis
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

## Troubleshooting

### Connection Issues

**Problem:** Client can't connect

**Solution:**
```javascript
// Check CORS settings
// Try polling transport first
const socket = io('http://localhost:3000/seats', {
  transports: ['polling', 'websocket'],
});
```

**Problem:** Events not received

**Solution:**
```javascript
// Ensure you're subscribed to the route
socket.emit('subscribe_route', { routeId: 'correct-uuid' });

// Check room name matches
console.log('Room:', `route:${routeId}`);
```

### Debugging

**Enable debug mode:**
```javascript
localStorage.debug = 'socket.io-client:socket';
```

**Check connection status:**
```javascript
console.log('Connected:', socket.connected);
console.log('Socket ID:', socket.id);
```

## Best Practices

1. **Subscribe on Mount, Unsubscribe on Unmount**
```javascript
useEffect(() => {
  socket.emit('subscribe_route', { routeId });
  return () => {
    socket.emit('unsubscribe_route', { routeId });
  };
}, [routeId]);
```

2. **Handle Reconnections**
```javascript
socket.on('reconnect', () => {
  // Re-subscribe after reconnection
  socket.emit('subscribe_route', { routeId });
});
```

3. **Error Handling**
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show user-friendly message
});
```

4. **Optimize Re-renders**
```javascript
// Use React.memo or useMemo to prevent unnecessary re-renders
const MemoizedSeatMap = React.memo(SeatMap);
```

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement presence detection (who's viewing)
- [ ] Add typing indicators (admin responding)
- [ ] Send bulk seat updates
- [ ] Add seat locking (temporary reservation)
- [ ] Implement seat selection collaboration
- [ ] Add chat support for customer service
- [ ] Real-time analytics dashboard

## API Reference

### Gateway Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `emitSeatReserved` | `SeatUpdateEvent` | Emit seat reserved event |
| `emitSeatConfirmed` | `SeatUpdateEvent` | Emit seat confirmed event |
| `emitSeatSuspended` | `SeatUpdateEvent` | Emit seat suspended event |
| `emitSeatCancelled` | `SeatUpdateEvent` | Emit seat cancelled event |
| `emitSeatAvailable` | `SeatUpdateEvent` | Emit seat available event |
| `getConnectionStats` | - | Get connection statistics |

### Event Types

| Event | Direction | Data Type |
|-------|-----------|-----------|
| `subscribe_route` | Client → Server | `{ routeId: string }` |
| `unsubscribe_route` | Client → Server | `{ routeId: string }` |
| `get_seat_availability` | Client → Server | `{ routeId: string }` |
| `seat_update` | Server → Client | `SeatUpdatePayload` |
| `subscribed` | Server → Client | `{ routeId, message }` |
| `unsubscribed` | Server → Client | `{ routeId, message }` |
| `error` | Server → Client | `{ message: string }` |

## Conclusion

The WebSocket Gateway provides a robust, real-time communication layer for seat availability updates. It integrates seamlessly with the existing ticket booking system and automatically notifies all subscribed clients when seat status changes occur.

For production deployment, ensure proper authentication, CORS configuration, and consider Redis adapter for multi-server setups.
