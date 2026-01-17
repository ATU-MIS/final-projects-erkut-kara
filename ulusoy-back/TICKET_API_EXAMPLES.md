# Ticket Module - API Examples

## Authentication Required

Most endpoints require authentication. Get your token first:

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Save the token
export TOKEN="your-jwt-token-here"
```

---

## Create Ticket (Book Seat)

### Standard Booking
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "550e8400-e29b-41d4-a716-446655440000",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "seatNumber": 15,
    "gender": "MALE",
    "userPhoneNumber": "+90 555 123 4567",
    "passengerName": "John Doe"
  }'
```

### Female Passenger Booking
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "route-uuid",
    "fromCity": "Ankara",
    "toCity": "Izmir",
    "seatNumber": 8,
    "gender": "FEMALE",
    "userPhoneNumber": "+90 555 999 8888",
    "passengerName": "Jane Smith"
  }'
```

---

## Get Available Seats

### Check Which Seats Are Free
```bash
# Get available seats for a route
curl http://localhost:3000/tickets/available-seats/route-uuid
```

**Response:**
```json
[1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 22, 25, ...]
```

---

## My Tickets

### Get All My Tickets
```bash
curl http://localhost:3000/tickets/my-tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Get Only Confirmed Tickets
```bash
curl "http://localhost:3000/tickets/my-tickets?status=CONFIRMED" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Only Reserved Tickets
```bash
curl "http://localhost:3000/tickets/my-tickets?status=RESERVED" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Find Ticket by PNR

### Check Ticket Status
```bash
curl http://localhost:3000/tickets/pnr/ABC123
```

**Response:**
```json
{
  "id": "uuid",
  "pnrNumber": "ABC123",
  "routeId": "uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "seatNumber": 15,
  "gender": "MALE",
  "price": 150.00,
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "route": {
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "departureTime": "2025-10-15T08:00:00.000Z",
    "bus": { ... }
  }
}
```

---

## Search Tickets

### Search by PNR (Partial Match)
```bash
curl "http://localhost:3000/tickets/search?pnrNumber=ABC"
```

### Search by Phone Number
```bash
curl "http://localhost:3000/tickets/search?userPhoneNumber=555123"
```

### Search by Cities
```bash
curl "http://localhost:3000/tickets/search?fromCity=Istanbul&toCity=Ankara"
```

### Search by Route
```bash
curl "http://localhost:3000/tickets/search?routeId=route-uuid"
```

### Search by Status
```bash
curl "http://localhost:3000/tickets/search?status=CONFIRMED"
```

### Search by Travel Date
```bash
curl "http://localhost:3000/tickets/search?date=2025-10-15"
```

### Combined Search
```bash
curl "http://localhost:3000/tickets/search?fromCity=Istanbul&status=CONFIRMED&paymentStatus=PAID"
```

---

## Confirm Ticket (Complete Payment)

```bash
curl -X PATCH http://localhost:3000/tickets/{ticket-id}/confirm \
  -H "Authorization: Bearer $TOKEN"
```

**Changes:**
- Status: RESERVED → CONFIRMED
- Payment Status: PENDING → PAID

---

## Update Ticket

### Change Seat Number
```bash
curl -X PATCH http://localhost:3000/tickets/{ticket-id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatNumber": 20
  }'
```

### Update Passenger Details
```bash
curl -X PATCH http://localhost:3000/tickets/{ticket-id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passengerName": "John Michael Doe",
    "userPhoneNumber": "+90 555 111 2222",
    "gender": "MALE"
  }'
```

---

## Cancel Ticket

### Customer Cancellation
```bash
curl -X PATCH http://localhost:3000/tickets/{ticket-id}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**If ticket was CONFIRMED/PAID:**
- Status: CANCELLED
- Payment Status: REFUNDED

**If ticket was RESERVED:**
- Status: CANCELLED
- Payment Status: PENDING (no refund needed)

---

## Suspend Ticket (Admin/Agent Only)

```bash
curl -X PATCH http://localhost:3000/tickets/{ticket-id}/suspend \
  -H "Authorization: Bearer $TOKEN"
```

**Use Cases:**
- Fraudulent booking suspected
- Payment dispute
- Administrative hold
- Investigation needed

---

## Admin Operations

### List All Tickets
```bash
curl http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Status
```bash
curl "http://localhost:3000/tickets?status=SUSPENDED" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by User
```bash
curl "http://localhost:3000/tickets?userId=user-uuid" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Payment Status
```bash
curl "http://localhost:3000/tickets?paymentStatus=PENDING" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Statistics (Admin/Agent Only)

```bash
curl http://localhost:3000/tickets/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "total": 500,
  "byStatus": {
    "reserved": 50,
    "confirmed": 400,
    "suspended": 10,
    "cancelled": 40
  },
  "byPaymentStatus": {
    "PENDING": {
      "count": 50,
      "revenue": 0
    },
    "PAID": {
      "count": 400,
      "revenue": 60000
    },
    "REFUNDED": {
      "count": 50,
      "revenue": 0
    }
  }
}
```

---

## Complete Booking Flow Example

```bash
# Step 1: Search for routes
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15"

# Step 2: Select a route (note the routeId)
ROUTE_ID="550e8400-e29b-41d4-a716-446655440000"

# Step 3: Check available seats
curl "http://localhost:3000/tickets/available-seats/$ROUTE_ID"
# Response: [1, 2, 3, 5, 8, 10, ...]

# Step 4: Book a seat
TICKET_RESPONSE=$(curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "'$ROUTE_ID'",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "seatNumber": 15,
    "gender": "MALE",
    "userPhoneNumber": "+90 555 123 4567",
    "passengerName": "John Doe"
  }')

# Extract ticket ID and PNR from response
TICKET_ID=$(echo $TICKET_RESPONSE | jq -r '.id')
PNR=$(echo $TICKET_RESPONSE | jq -r '.pnrNumber')

echo "Ticket booked! PNR: $PNR"

# Step 5: Confirm payment
curl -X PATCH "http://localhost:3000/tickets/$TICKET_ID/confirm" \
  -H "Authorization: Bearer $TOKEN"

# Step 6: Check ticket status
curl "http://localhost:3000/tickets/pnr/$PNR"
```

---

## Error Scenarios

### Attempt Double Booking
```bash
# Book seat 15
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "seatNumber": 15, ... }'
# Success

# Try to book seat 15 again
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "seatNumber": 15, ... }'
# Error 409: "Seat 15 is already booked on this route"
```

### Invalid Seat Number
```bash
# Bus has 48 seats, try to book seat 50
curl -X POST http://localhost:3000/tickets \
  -d '{ "seatNumber": 50, ... }'
# Error 400: "Invalid seat number. Bus has only 48 seats"
```

### Cancel After Departure
```bash
# Try to cancel ticket for route that already departed
curl -X PATCH http://localhost:3000/tickets/{id}/cancel
# Error 400: "Cannot cancel tickets for departed routes"
```

### Update Cancelled Ticket
```bash
# Try to update a cancelled ticket
curl -X PATCH http://localhost:3000/tickets/{id} \
  -d '{ "seatNumber": 20 }'
# Error 400: "Cannot update cancelled tickets"
```

---

## Testing Workflow

### Test Double Booking Prevention
```bash
#!/bin/bash

ROUTE_ID="your-route-id"
TOKEN1="user1-token"
TOKEN2="user2-token"

# User 1 books seat 15
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "routeId": "'$ROUTE_ID'",
    "seatNumber": 15,
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "gender": "MALE",
    "userPhoneNumber": "+90 555 111 1111",
    "passengerName": "User One"
  }'

# User 2 tries to book seat 15 (should fail)
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{
    "routeId": "'$ROUTE_ID'",
    "seatNumber": 15,
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "gender": "FEMALE",
    "userPhoneNumber": "+90 555 222 2222",
    "passengerName": "User Two"
  }'
# Expected: 409 Conflict
```

---

## Integration Examples

### With Payment Gateway
```bash
# 1. Create ticket (RESERVED status)
TICKET=$(curl -X POST /tickets ...)
TICKET_ID=$(echo $TICKET | jq -r '.id')

# 2. Process payment with external gateway
# ... payment gateway logic ...

# 3. If payment successful, confirm ticket
if [ $PAYMENT_SUCCESS ]; then
  curl -X PATCH /tickets/$TICKET_ID/confirm \
    -H "Authorization: Bearer $TOKEN"
fi

# 4. If payment failed, cancel ticket
if [ $PAYMENT_FAILED ]; then
  curl -X PATCH /tickets/$TICKET_ID/cancel \
    -H "Authorization: Bearer $TOKEN"
fi
```

### Customer Support Script
```bash
#!/bin/bash

# Support agent checks ticket by PNR
read -p "Enter PNR: " PNR

curl "http://localhost:3000/tickets/pnr/$PNR" | jq '.'

# Show available actions based on status
echo "Available actions:"
echo "1. Suspend ticket"
echo "2. Cancel ticket"
echo "3. View passenger details"
```

---

## Response Examples

### Successful Booking Response
```json
{
  "id": "ticket-uuid",
  "pnrNumber": "XY3Z89",
  "routeId": "route-uuid",
  "userId": "user-uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "seatNumber": 15,
  "gender": "MALE",
  "price": 150.00,
  "userPhoneNumber": "+90 555 123 4567",
  "passengerName": "John Doe",
  "status": "RESERVED",
  "paymentStatus": "PENDING",
  "suspendedAt": null,
  "cancelledAt": null,
  "createdAt": "2025-10-14T10:30:00.000Z",
  "updatedAt": "2025-10-14T10:30:00.000Z",
  "route": {
    "id": "route-uuid",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "departureTime": "2025-10-15T08:00:00.000Z",
    "arrivalTime": "2025-10-15T14:00:00.000Z",
    "price": 150.00,
    "type": "EXPRESS",
    "bus": {
      "plate": "34ABC123",
      "model": "Travego 17 SHD",
      "seatCount": 48,
      "layoutType": "LAYOUT_2_1",
      "specs": { ... }
    }
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```
