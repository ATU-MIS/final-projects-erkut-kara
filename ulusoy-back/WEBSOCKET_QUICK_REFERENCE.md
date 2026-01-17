# WebSocket Quick Reference

## Quick Start

### Connect
```javascript
import io from 'socket.io-client';
const socket = io('http://localhost:3000/seats');
```

### Subscribe to Route
```javascript
socket.emit('subscribe_route', { routeId: 'route-uuid' });
```

### Listen for Updates
```javascript
socket.on('seat_update', (payload) => {
  console.log('Seat update:', payload);
  // Handle seat status change
});
```

## Event Types

| Event Type | Trigger | Seat Status |
|------------|---------|-------------|
| `seat_reserved` | Ticket booked | Reserved (unpaid) |
| `seat_confirmed` | Payment success | Confirmed (paid) |
| `seat_suspended` | Admin/agent action | Suspended |
| `seat_cancelled` | Ticket cancelled | Cancelled |
| `seat_available` | After cancellation | Available |

## Payload Structure

```typescript
{
  routeId: string;
  seatNumber: number;
  eventType: string;
  ticketId?: string;
  pnrNumber?: string;
  timestamp: Date;
  metadata?: {
    fromCity?: string;
    toCity?: string;
    price?: number;
    gender?: string;
  };
}
```

## Common Use Cases

### 1. Real-time Seat Map
```javascript
socket.on('seat_update', (payload) => {
  updateSeatUI(payload.seatNumber, payload.eventType);
});
```

### 2. Availability Notifications
```javascript
socket.on('seat_update', (payload) => {
  if (payload.eventType === 'seat_available') {
    notify(`Seat ${payload.seatNumber} is now available!`);
  }
});
```

### 3. Booking Conflicts
```javascript
socket.on('seat_update', (payload) => {
  if (payload.eventType === 'seat_reserved' && 
      payload.seatNumber === selectedSeat) {
    alert('This seat was just booked by someone else!');
  }
});
```

## React Hook Example

```javascript
function useRouteUpdates(routeId) {
  const [seats, setSeats] = useState({});

  useEffect(() => {
    const socket = io('http://localhost:3000/seats');
    
    socket.on('connect', () => {
      socket.emit('subscribe_route', { routeId });
    });

    socket.on('seat_update', (payload) => {
      setSeats(prev => ({
        ...prev,
        [payload.seatNumber]: payload.eventType
      }));
    });

    return () => {
      socket.emit('unsubscribe_route', { routeId });
      socket.disconnect();
    };
  }, [routeId]);

  return seats;
}
```

## Testing

### Browser Console
```javascript
const socket = io('http://localhost:3000/seats');
socket.on('connect', () => {
  socket.emit('subscribe_route', { routeId: 'your-route-id' });
});
socket.on('seat_update', console.log);
```

### Test Sequence
1. Connect to WebSocket
2. Subscribe to route
3. Book ticket via REST API: `POST /tickets`
4. See `seat_reserved` event
5. Pay for ticket via REST API: `POST /payments`
6. See `seat_confirmed` event
7. Cancel ticket via REST API: `DELETE /tickets/:id`
8. See `seat_cancelled` and `seat_available` events

## Error Handling

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Auto-reconnect happens automatically
});

socket.on('reconnect', () => {
  // Re-subscribe after reconnection
  socket.emit('subscribe_route', { routeId });
});
```

## Production Checklist

- [ ] Configure CORS properly
- [ ] Add authentication (JWT)
- [ ] Set up SSL/TLS (wss://)
- [ ] Implement rate limiting
- [ ] Add Redis adapter for scaling
- [ ] Monitor connection count
- [ ] Log errors and events
- [ ] Test reconnection scenarios
- [ ] Handle network failures
- [ ] Optimize payload size

## Endpoints

| Type | Event | Direction |
|------|-------|-----------|
| Emit | `subscribe_route` | Client → Server |
| Emit | `unsubscribe_route` | Client → Server |
| Listen | `seat_update` | Server → Client |
| Listen | `subscribed` | Server → Client |
| Listen | `error` | Server → Client |

## Full Documentation

See [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md) for complete details.
