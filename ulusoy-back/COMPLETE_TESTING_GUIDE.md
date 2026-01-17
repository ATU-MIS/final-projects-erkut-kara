# 🧪 Complete Project Testing Guide

## 📋 Pre-Testing Checklist

### 1. ✅ Verify Installation
```bash
# Check if node_modules exists
ls node_modules

# Verify dependencies are installed
npm list --depth=0
```

### 2. ✅ Environment Setup
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your database credentials
# Make sure PostgreSQL is running on localhost:5432
```

### 3. ✅ Database Setup
```bash
# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate
# When prompted, name it: "initial_complete_system"

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

---

## 🚀 Phase 1: Start the Server

### Start Development Server
```bash
npm run start:dev
```

**Expected Output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [InstanceLoader] PrismaModule dependencies initialized
[Nest] INFO [InstanceLoader] AuthModule dependencies initialized
[Nest] INFO [InstanceLoader] BusModule dependencies initialized
[Nest] INFO [InstanceLoader] RouteModule dependencies initialized
[Nest] INFO [InstanceLoader] TicketModule dependencies initialized
[Nest] INFO [InstanceLoader] PaymentModule dependencies initialized
[Nest] INFO [RoutesResolver] TicketController {/tickets}
[Nest] INFO [RoutesResolver] PaymentController {/payments}
[Nest] INFO Application is running on: http://localhost:3000
```

**✅ Server is running if you see "Application is running on: http://localhost:3000"**

---

## 🧪 Phase 2: Test Authentication Module

### 1. Register a User

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+90 555 111 2233",
    "role": "ADMIN"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@test.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**✅ Save the `access_token` for subsequent requests!**

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

### 3. Get Current User

**Request:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚌 Phase 3: Test Bus Module

### 1. Create a Bus

**Request:**
```bash
curl -X POST http://localhost:3000/buses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "plate": "34ABC123",
    "model": "Mercedes Travego",
    "seatCount": 45,
    "layoutType": "TWO_PLUS_ONE",
    "busPhone": "+90 555 999 8877",
    "specs": {
      "brand": "Mercedes-Benz",
      "year": 2023,
      "engineType": "Diesel",
      "fuelType": "Diesel",
      "hasAC": true,
      "hasWiFi": true,
      "hasToilet": true,
      "hasTV": true,
      "customFeatures": ["USB Charging", "Reclining Seats"]
    }
  }'
```

**✅ Save the `id` of the created bus!**

### 2. List All Buses

**Request:**
```bash
curl -X GET http://localhost:3000/buses
```

### 3. Get Bus Statistics

**Request:**
```bash
curl -X GET http://localhost:3000/buses/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🛣️ Phase 4: Test Route Module

### 1. Create a Route

**Request:**
```bash
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "busId": "BUS_ID_FROM_PREVIOUS_STEP",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "departureTime": "2025-10-15T08:00:00.000Z",
    "arrivalTime": "2025-10-15T14:00:00.000Z",
    "price": 150.00,
    "type": "EXPRESS",
    "stations": ["Bolu", "Gerede"]
  }'
```

**✅ Save the `id` of the created route!**

### 2. Search Routes

**Request:**
```bash
curl -X GET "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara"
```

### 3. Get Route Details

**Request:**
```bash
curl -X GET http://localhost:3000/routes/ROUTE_ID_HERE
```

---

## 🎫 Phase 5: Test Ticket Module

### 1. Check Available Seats

**Request:**
```bash
curl -X GET http://localhost:3000/tickets/available-seats/ROUTE_ID_HERE
```

**Expected Response:**
```json
{
  "routeId": "uuid",
  "totalSeats": 45,
  "availableSeats": [1, 2, 3, 4, ..., 45],
  "bookedSeats": [],
  "availableCount": 45
}
```

### 2. Book a Ticket

**Request:**
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "ROUTE_ID_HERE",
    "seatNumber": 15,
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "gender": "MALE",
    "userPhoneNumber": "+90 555 123 4567",
    "passengerName": "John Doe"
  }'
```

**Expected Response:**
```json
{
  "id": "ticket-uuid",
  "pnrNumber": "ABC123",
  "status": "RESERVED",
  "paymentStatus": "PENDING",
  "seatNumber": 15,
  "price": 150.00,
  ...
}
```

**✅ Save the `id` and `pnrNumber`!**

### 3. Find Ticket by PNR

**Request:**
```bash
curl -X GET http://localhost:3000/tickets/pnr/ABC123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get My Tickets

**Request:**
```bash
curl -X GET http://localhost:3000/tickets/my-tickets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 💳 Phase 6: Test Payment Module (Mock)

### 1. Process Payment (Success Card)

**Request:**
```bash
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "TICKET_ID_HERE",
    "cardHolderName": "John Doe",
    "cardNumber": "4111111111110000",
    "expireMonth": "12",
    "expireYear": "2030",
    "cvc": "123",
    "email": "john@example.com",
    "billingAddress": "Test Address",
    "billingCity": "Istanbul",
    "billingCountry": "Turkey"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "ticket": {
    "id": "ticket-uuid",
    "pnrNumber": "ABC123",
    "status": "CONFIRMED",
    "paymentStatus": "PAID"
  },
  "payment": {
    "transactionId": "TXN-...",
    "amount": 150.00,
    "currency": "TRY",
    "provider": "mock"
  }
}
```

**✅ Ticket should now be CONFIRMED and PAID!**

### 2. Process Payment (Failed Card)

**Request with card ending in 1111 for failure test:**
```bash
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "ANOTHER_TICKET_ID",
    "cardHolderName": "John Doe",
    "cardNumber": "4111111111111111",
    "expireMonth": "12",
    "expireYear": "2030",
    "cvc": "123",
    "email": "john@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Insufficient funds",
  "errorCode": "INSUFFICIENT_FUNDS"
}
```

### 3. Get Payment History

**Request:**
```bash
curl -X GET http://localhost:3000/payments/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔌 Phase 7: Test WebSocket Real-Time Updates

### Option A: Using HTML Test Page

1. **Open the test page:**
   - Open `websocket-test.html` in your browser
   - Click "Connect" button
   - Enter the Route ID from Phase 4
   - Click "Subscribe to Route"

2. **Trigger events:**
   - Book a ticket via REST API (Phase 5, Step 2)
   - **Watch the event appear in real-time on the HTML page!** 🎉
   - Pay for the ticket (Phase 6, Step 1)
   - **Watch the confirmation event appear!** 🎉
   - Cancel the ticket
   - **Watch cancellation + available events!** 🎉

### Option B: Using Browser Console

1. **Open browser console** (F12)

2. **Connect to WebSocket:**
```javascript
const socket = io('http://localhost:3000/seats');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('subscribe_route', { routeId: 'YOUR_ROUTE_ID' });
});

socket.on('seat_update', (data) => {
  console.log('Seat Update:', data);
});
```

3. **Book a ticket via REST API** and watch console for events!

### Option C: Using Postman

1. Create new WebSocket Request
2. Connect to: `ws://localhost:3000/seats`
3. Send: `{"event": "subscribe_route", "data": {"routeId": "your-route-id"}}`
4. Book ticket via REST
5. Watch for `seat_update` messages

---

## 🧪 Phase 8: Test Cancellation & Refund

### 1. Cancel a Paid Ticket

**Request:**
```bash
curl -X DELETE http://localhost:3000/tickets/TICKET_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": "ticket-uuid",
  "status": "CANCELLED",
  "paymentStatus": "REFUNDED",
  "cancelledAt": "2025-10-14T..."
}
```

**✅ WebSocket should emit TWO events:**
1. `seat_cancelled`
2. `seat_available`

### 2. Process Refund

**Request:**
```bash
curl -X POST http://localhost:3000/payments/refund/TICKET_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔄 Phase 9: Test Complete User Flow

### Full Journey Test

1. **Register** → Get token
2. **Create Bus** → Get bus ID
3. **Create Route** → Get route ID
4. **Subscribe to WebSocket** → Watch for events
5. **Check Available Seats** → See all 45 seats available
6. **Book Ticket (Seat 15)** → See `seat_reserved` event in WebSocket
7. **Check Available Seats** → See seat 15 is gone
8. **Pay for Ticket** → See `seat_confirmed` event in WebSocket
9. **Find Ticket by PNR** → Verify status is CONFIRMED
10. **Cancel Ticket** → See `seat_cancelled` + `seat_available` events
11. **Check Available Seats** → See seat 15 is back!

---

## 📊 Phase 10: Test Statistics & Admin Features

### 1. Bus Statistics

**Request:**
```bash
curl -X GET http://localhost:3000/buses/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Route Statistics

**Request:**
```bash
curl -X GET http://localhost:3000/routes/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Ticket Statistics

**Request:**
```bash
curl -X GET http://localhost:3000/tickets/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ Testing Checklist

### Authentication Module
- [ ] Register user (Admin)
- [ ] Register user (Customer)
- [ ] Login with credentials
- [ ] Get current user info
- [ ] Invalid credentials fail properly

### Bus Module
- [ ] Create bus with specs
- [ ] List all buses
- [ ] Get bus by ID
- [ ] Get bus by plate
- [ ] Update bus (Admin only)
- [ ] Delete bus (Admin only)
- [ ] Get bus statistics

### Route Module
- [ ] Create route
- [ ] List all routes
- [ ] Search routes (by cities)
- [ ] Search routes (by date)
- [ ] Get route details
- [ ] Get upcoming routes
- [ ] Update route
- [ ] Delete route
- [ ] Prevent bus double-booking

### Ticket Module
- [ ] Check available seats
- [ ] Book ticket
- [ ] Find ticket by PNR
- [ ] Get user's tickets
- [ ] Confirm ticket
- [ ] Suspend ticket (Admin)
- [ ] Cancel ticket
- [ ] Prevent double booking
- [ ] Prevent booking after departure

### Payment Module
- [ ] Process payment (mock success)
- [ ] Process payment (mock failure)
- [ ] Auto-confirm ticket after payment
- [ ] Get payment history
- [ ] Process refund
- [ ] Prevent refund after departure

### WebSocket Module
- [ ] Connect to WebSocket
- [ ] Subscribe to route
- [ ] Unsubscribe from route
- [ ] Receive `seat_reserved` event
- [ ] Receive `seat_confirmed` event
- [ ] Receive `seat_suspended` event
- [ ] Receive `seat_cancelled` event
- [ ] Receive `seat_available` event
- [ ] Multiple clients receive same event
- [ ] Reconnection works properly

### Integration Tests
- [ ] Complete booking flow (reserve → pay → confirm)
- [ ] Complete cancellation flow (cancel → refund → available)
- [ ] Double-booking prevention works
- [ ] WebSocket events match REST actions
- [ ] Role-based access control works

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill process if needed (replace PID)
taskkill /PID <PID> /F

# Check database connection
# Make sure PostgreSQL is running
```

### Database errors
```bash
# Reset database
npm run prisma:migrate reset

# Regenerate Prisma Client
npm run prisma:generate
```

### WebSocket won't connect
```bash
# Check if server is running
curl http://localhost:3000

# Check CORS settings in main.ts
# Make sure WebSocket is enabled
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Success Criteria

**Your project is fully working if:**

✅ Server starts without errors  
✅ You can register and login  
✅ You can create buses and routes  
✅ You can book tickets  
✅ You can pay for tickets  
✅ WebSocket events arrive in real-time  
✅ Double-booking is prevented  
✅ Cancellation and refunds work  
✅ All statistics endpoints return data  

---

## 📝 Next Steps After Testing

1. **Frontend Integration** - Connect your Nuxt.js frontend
2. **Production Setup** - Configure real iyzico credentials
3. **Add Authentication** - JWT auth for WebSocket
4. **Deploy** - Deploy to production server
5. **Monitoring** - Set up logging and monitoring
6. **Testing** - Write automated tests

---

**🎊 Congratulations! You now have a fully functional bus ticketing platform with real-time seat updates!**

For detailed API documentation, see:
- `API_DOCUMENTATION.md`
- `WEBSOCKET_DOCUMENTATION.md`
- `PAYMENT_MODULE_DOCUMENTATION.md`
