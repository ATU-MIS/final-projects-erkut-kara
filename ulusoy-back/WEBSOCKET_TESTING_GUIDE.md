# WebSocket Testing Guide

Complete guide for testing the real-time seat update WebSocket implementation.

## Prerequisites

```bash
# Ensure server is running
npm run start:dev

# Server should be listening on http://localhost:3000
# WebSocket endpoint: ws://localhost:3000/seats
```

## Test 1: Basic Connection

### Using Browser Console

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000/seats', {
  transports: ['websocket']
});

// Listen for connection
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

socket.on('error', (error) => {
  console.error('⚠️ WebSocket error:', error);
});
```

**Expected Result:**
```
✅ Connected to WebSocket
Socket ID: abc123def456
```

## Test 2: Route Subscription

### Subscribe to a Route

```javascript
const testRouteId = 'YOUR_ROUTE_ID_HERE'; // Replace with actual route ID

socket.emit('subscribe_route', { routeId: testRouteId });

socket.on('subscribed', (data) => {
  console.log('✅ Subscribed:', data);
});
```

**Expected Result:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Successfully subscribed to route 550e8400-e29b-41d4-a716-446655440000"
}
```

### Unsubscribe from a Route

```javascript
socket.emit('unsubscribe_route', { routeId: testRouteId });

socket.on('unsubscribed', (data) => {
  console.log('✅ Unsubscribed:', data);
});
```

**Expected Result:**
```json
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Successfully unsubscribed from route 550e8400-e29b-41d4-a716-446655440000"
}
```

## Test 3: Seat Reservation Event

### Setup Listener

```javascript
socket.on('seat_update', (payload) => {
  console.log('📢 Seat Update Event:', payload);
  
  if (payload.eventType === 'seat_reserved') {
    console.log(`✅ Seat ${payload.seatNumber} was reserved`);
    console.log('PNR:', payload.pnrNumber);
    console.log('Route:', payload.routeId);
  }
});
```

### Trigger Event (via REST API)

```bash
# Book a ticket
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "550e8400-e29b-41d4-a716-446655440000",
    "seatNumber": 15,
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "gender": "MALE",
    "userPhoneNumber": "+90 555 123 4567",
    "passengerName": "John Doe"
  }'
```

**Expected WebSocket Event:**
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

## Test 4: Payment Confirmation Event

### Trigger Payment (via REST API)

```bash
# Pay for the ticket
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "660e8400-e29b-41d4-a716-446655440001",
    "cardHolderName": "John Doe",
    "cardNumber": "4111111111110000",
    "expireMonth": "12",
    "expireYear": "2030",
    "cvc": "123",
    "email": "john@example.com"
  }'
```

**Expected WebSocket Event:**
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

## Test 5: Ticket Suspension Event

### Trigger Suspension (Admin/Agent only)

```bash
curl -X PUT http://localhost:3000/tickets/660e8400-e29b-41d4-a716-446655440001/suspend \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Expected WebSocket Event:**
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

## Test 6: Ticket Cancellation Events

### Trigger Cancellation

```bash
curl -X DELETE http://localhost:3000/tickets/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected WebSocket Events (2 events):**

Event 1 - Cancelled:
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

Event 2 - Available:
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

## Test 7: Multiple Clients

### Terminal 1 - Client A

```javascript
const socketA = io('http://localhost:3000/seats');
socketA.on('connect', () => {
  console.log('Client A connected:', socketA.id);
  socketA.emit('subscribe_route', { routeId: 'YOUR_ROUTE_ID' });
});
socketA.on('seat_update', (data) => {
  console.log('Client A received:', data.eventType);
});
```

### Terminal 2 - Client B

```javascript
const socketB = io('http://localhost:3000/seats');
socketB.on('connect', () => {
  console.log('Client B connected:', socketB.id);
  socketB.emit('subscribe_route', { routeId: 'YOUR_ROUTE_ID' });
});
socketB.on('seat_update', (data) => {
  console.log('Client B received:', data.eventType);
});
```

### Book a Ticket (Terminal 3)

```bash
curl -X POST http://localhost:3000/tickets ... (with same routeId)
```

**Expected Result:**
Both Client A and Client B should receive the `seat_reserved` event simultaneously.

```
Client A received: seat_reserved
Client B received: seat_reserved
```

## Test 8: Error Handling

### Test Invalid Route ID

```javascript
socket.emit('subscribe_route', { routeId: '' });

socket.on('error', (error) => {
  console.log('✅ Error caught:', error);
});
```

**Expected Result:**
```json
{
  "message": "Route ID is required"
}
```

### Test Missing Data

```javascript
socket.emit('subscribe_route', {});

socket.on('error', (error) => {
  console.log('✅ Error caught:', error);
});
```

**Expected Result:**
```json
{
  "message": "Route ID is required"
}
```

## Test 9: Reconnection

### Simulate Disconnection

```javascript
// Monitor reconnection
socket.on('reconnect', (attemptNumber) => {
  console.log('✅ Reconnected after', attemptNumber, 'attempts');
  
  // Re-subscribe after reconnection
  socket.emit('subscribe_route', { routeId: testRouteId });
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('⏳ Reconnection attempt:', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Reconnection error:', error);
});

// Manually disconnect
socket.disconnect();

// Wait 2 seconds
setTimeout(() => {
  // Manually reconnect
  socket.connect();
}, 2000);
```

**Expected Result:**
```
⏳ Reconnection attempt: 1
✅ Reconnected after 1 attempts
```

## Test 10: Performance Test

### Load Test with Multiple Subscriptions

```javascript
const routeIds = [
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440002',
];

let eventCount = 0;
const startTime = Date.now();

socket.on('seat_update', () => {
  eventCount++;
});

// Subscribe to all routes
routeIds.forEach(routeId => {
  socket.emit('subscribe_route', { routeId });
});

// After 1 minute, check stats
setTimeout(() => {
  const duration = (Date.now() - startTime) / 1000;
  const eventsPerSecond = eventCount / duration;
  
  console.log('📊 Performance Stats:');
  console.log(`Total Events: ${eventCount}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Events/Second: ${eventsPerSecond.toFixed(2)}`);
}, 60000);
```

## Test 11: Complete User Journey

### Full Flow Test Script

```javascript
// 1. Connect
const socket = io('http://localhost:3000/seats');
const routeId = 'YOUR_ROUTE_ID';
let ticketId;

socket.on('connect', () => {
  console.log('✅ Step 1: Connected');
  
  // 2. Subscribe
  socket.emit('subscribe_route', { routeId });
});

socket.on('subscribed', () => {
  console.log('✅ Step 2: Subscribed to route');
});

socket.on('seat_update', async (payload) => {
  console.log('📢 Event:', payload.eventType);
  
  if (payload.eventType === 'seat_reserved') {
    console.log('✅ Step 3: Seat reserved event received');
    ticketId = payload.ticketId;
    
    // Wait 2 seconds then pay
    setTimeout(async () => {
      console.log('💳 Step 4: Processing payment...');
      // Make payment API call here
    }, 2000);
  }
  
  if (payload.eventType === 'seat_confirmed') {
    console.log('✅ Step 5: Seat confirmed event received');
    console.log('🎉 Journey complete!');
    
    // Optionally test cancellation
    setTimeout(() => {
      console.log('🗑️ Step 6: Cancelling ticket...');
      // Make cancellation API call here
    }, 5000);
  }
  
  if (payload.eventType === 'seat_cancelled') {
    console.log('✅ Step 7: Seat cancelled event received');
  }
  
  if (payload.eventType === 'seat_available') {
    console.log('✅ Step 8: Seat available event received');
    console.log('✅ Full journey test complete!');
  }
});

// Make the booking API call
// This should trigger the entire flow
```

## Test 12: React Component Test

### Create Test Component

```jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

function WebSocketTester() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [socket, setSocket] = useState(null);
  const routeId = 'YOUR_ROUTE_ID';

  useEffect(() => {
    const newSocket = io('http://localhost:3000/seats');
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected');
      newSocket.emit('subscribe_route', { routeId });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected');
    });

    newSocket.on('seat_update', (payload) => {
      setEvents(prev => [...prev, {
        ...payload,
        receivedAt: new Date().toISOString()
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe_route', { routeId });
      newSocket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>WebSocket Tester</h2>
      <p>Status: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
      <p>Events Received: {events.length}</p>
      
      <div>
        <h3>Events:</h3>
        {events.map((event, index) => (
          <div key={index} style={{ 
            border: '1px solid #ccc', 
            margin: '10px', 
            padding: '10px' 
          }}>
            <strong>{event.eventType}</strong>
            <p>Seat: {event.seatNumber}</p>
            <p>PNR: {event.pnrNumber}</p>
            <p>Received: {event.receivedAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WebSocketTester;
```

## Test 13: Postman WebSocket Test

### Setup

1. Open Postman
2. Create new "WebSocket Request"
3. URL: `ws://localhost:3000/seats`
4. Click "Connect"

### Send Messages

**Subscribe:**
```json
{
  "event": "subscribe_route",
  "data": {
    "routeId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Listen for Events:**
Watch the message panel for `seat_update` events.

**Unsubscribe:**
```json
{
  "event": "unsubscribe_route",
  "data": {
    "routeId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Test 14: Automated E2E Test (Jest)

### Example Test Suite

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';

describe('WebSocket Gateway (e2e)', () => {
  let app: INestApplication;
  let socket: Socket;
  const routeId = 'test-route-id';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3000);
  });

  beforeEach((done) => {
    socket = io('http://localhost:3000/seats', {
      transports: ['websocket'],
    });
    socket.on('connect', () => done());
  });

  afterEach(() => {
    socket.disconnect();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should connect successfully', (done) => {
    expect(socket.connected).toBe(true);
    done();
  });

  it('should subscribe to route', (done) => {
    socket.emit('subscribe_route', { routeId });
    
    socket.on('subscribed', (data) => {
      expect(data.routeId).toBe(routeId);
      expect(data.message).toContain('Successfully subscribed');
      done();
    });
  });

  it('should receive seat_update event', (done) => {
    socket.emit('subscribe_route', { routeId });
    
    socket.on('seat_update', (payload) => {
      expect(payload).toHaveProperty('routeId');
      expect(payload).toHaveProperty('seatNumber');
      expect(payload).toHaveProperty('eventType');
      done();
    });

    // Trigger event by booking ticket via REST API
    // (would need actual API call here)
  }, 10000);
});
```

## Test Results Checklist

### Basic Functionality
- [ ] WebSocket connection established
- [ ] Subscribe to route successful
- [ ] Unsubscribe from route successful
- [ ] Receive `seat_reserved` event
- [ ] Receive `seat_confirmed` event
- [ ] Receive `seat_suspended` event
- [ ] Receive `seat_cancelled` event
- [ ] Receive `seat_available` event

### Error Handling
- [ ] Error on invalid route ID
- [ ] Error on missing data
- [ ] Graceful disconnect handling
- [ ] Successful reconnection
- [ ] Re-subscription after reconnection

### Performance
- [ ] Multiple clients receive events
- [ ] Events received in real-time (<100ms)
- [ ] No memory leaks
- [ ] Connection cleanup on disconnect

### Integration
- [ ] Ticket creation triggers event
- [ ] Payment success triggers event
- [ ] Ticket suspension triggers event
- [ ] Ticket cancellation triggers events
- [ ] Multiple event types work together

## Troubleshooting

### Issue: Cannot connect

**Check:**
```javascript
// Enable Socket.IO debug mode
localStorage.debug = 'socket.io-client:socket';

// Then reload and check console
```

### Issue: Events not received

**Check:**
```javascript
// Verify subscription
socket.emit('subscribe_route', { routeId: 'correct-route-id' });

// Verify listener
socket.on('seat_update', console.log);

// Check if socket is connected
console.log('Connected:', socket.connected);
```

### Issue: Multiple events

**Check:**
```javascript
// Remove duplicate listeners
socket.off('seat_update');

// Then add listener once
socket.on('seat_update', handleEvent);
```

## Performance Benchmarks

### Expected Performance

| Metric | Expected Value |
|--------|----------------|
| Connection Time | < 100ms |
| Event Latency | < 50ms |
| Concurrent Connections | 10,000+ |
| Events/Second | 1,000+ |
| Memory Usage | < 100MB |

### Monitoring Commands

```bash
# Check Node.js memory usage
process.memoryUsage()

# Check active connections
# (Add endpoint in gateway)
GET /websocket/stats
```

## Conclusion

This testing guide covers all aspects of the WebSocket implementation. Run through each test to verify the system works correctly before deploying to production.

**Next Steps:**
1. Run all basic tests
2. Verify error handling
3. Test with multiple clients
4. Perform load testing
5. Document any issues found
