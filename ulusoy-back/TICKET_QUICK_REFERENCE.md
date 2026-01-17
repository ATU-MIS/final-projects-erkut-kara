# Ticket Module - Quick Reference

## Quick Book

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "route-uuid",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "seatNumber": 15,
    "gender": "MALE",
    "userPhoneNumber": "+90 555 123 4567",
    "passengerName": "John Doe"
  }'
```

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pnrNumber | String | Auto | 6-char unique code (e.g., ABC123) |
| routeId | UUID | Yes | Reference to route |
| userId | UUID | Auto | From authenticated user |
| fromCity | String | Yes | Departure city |
| toCity | String | Yes | Destination city |
| seatNumber | Int | Yes | 1 to bus capacity |
| gender | Enum | Yes | MALE, FEMALE, OTHER |
| price | Float | Auto | From route price |
| userPhoneNumber | String | Yes | Contact number |
| passengerName | String | Yes | Full name |
| status | Enum | Auto | RESERVED, CONFIRMED, SUSPENDED, CANCELLED |
| paymentStatus | Enum | Auto | PENDING, PAID, REFUNDED |

## Endpoint Cheat Sheet

```
POST   /tickets                           Book seat (Auth)
GET    /tickets/my-tickets                My tickets (Auth)
GET    /tickets/pnr/:pnr                  Find by PNR
GET    /tickets/available-seats/:routeId  Check availability
GET    /tickets/search                    Search tickets
GET    /tickets/:id                       Get details (Auth)
GET    /tickets                           List all (Admin/Agent)
GET    /tickets/stats                     Statistics (Admin/Agent)
PATCH  /tickets/:id                       Update (Auth)
PATCH  /tickets/:id/confirm               Confirm booking (Auth)
PATCH  /tickets/:id/suspend               Suspend (Admin/Agent)
PATCH  /tickets/:id/cancel                Cancel (Auth)
```

## Status Types

```
RESERVED   → Initial booking state
CONFIRMED  → Payment completed
SUSPENDED  → Admin/Agent hold
CANCELLED  → Booking cancelled
```

## Payment Status

```
PENDING   → Awaiting payment
PAID      → Payment completed
REFUNDED  → Money returned
```

## Gender Options

```
MALE    → Male passenger
FEMALE  → Female passenger
OTHER   → Other/prefer not to say
```

## Common Operations

### Check Available Seats
```bash
curl http://localhost:3000/tickets/available-seats/route-uuid
```

### Find My Tickets
```bash
curl http://localhost:3000/tickets/my-tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Find by PNR
```bash
curl http://localhost:3000/tickets/pnr/ABC123
```

### Confirm Booking
```bash
curl -X PATCH http://localhost:3000/tickets/{id}/confirm \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel Ticket
```bash
curl -X PATCH http://localhost:3000/tickets/{id}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

## Search Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| pnrNumber | `?pnrNumber=ABC` | Search by PNR (partial) |
| routeId | `?routeId=uuid` | Filter by route |
| userId | `?userId=uuid` | Filter by user |
| fromCity | `?fromCity=Istanbul` | Departure city |
| toCity | `?toCity=Ankara` | Destination city |
| status | `?status=CONFIRMED` | Ticket status |
| paymentStatus | `?paymentStatus=PAID` | Payment state |
| gender | `?gender=MALE` | Passenger gender |
| userPhoneNumber | `?userPhoneNumber=555` | Phone search |
| date | `?date=2025-10-15` | Travel date |

## Permission Matrix

| Action | Customer | Agent | Admin |
|--------|----------|-------|-------|
| Book | ✅ Own | ✅ Any | ✅ Any |
| View Own | ✅ | ✅ | ✅ |
| View All | ❌ | ✅ | ✅ |
| Update | ✅ Own | ❌ | ✅ Any |
| Confirm | ✅ Own | ❌ | ✅ Any |
| Suspend | ❌ | ✅ | ✅ |
| Cancel | ✅ Own | ❌ | ✅ Any |

## Status Flow

```
RESERVED → CONFIRMED (payment)
RESERVED → SUSPENDED (admin)
RESERVED → CANCELLED (user/admin)

CONFIRMED → SUSPENDED (admin)
CONFIRMED → CANCELLED (user/admin)

SUSPENDED → CONFIRMED (admin)
SUSPENDED → CANCELLED (admin)
```

## Validation Rules

✅ **Required**: routeId, fromCity, toCity, seatNumber, gender, phone, name
✅ **Route**: Must exist and be active
✅ **Seat**: Must be 1 to bus capacity
✅ **Double-Booking**: Prevented by unique constraint
✅ **Cancellation**: Only before route departure
✅ **Updates**: Cannot update cancelled tickets

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid seat, cancelled ticket update |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Wrong user, insufficient role |
| 404 | Not Found | Route/ticket not found |
| 409 | Conflict | Seat already booked |

## Example Workflow

```bash
# 1. Search routes
curl "/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15"

# 2. Check seats
curl "/tickets/available-seats/route-uuid"

# 3. Book seat
curl -X POST /tickets -H "Authorization: Bearer $TOKEN" -d '{...}'
# Save PNR from response!

# 4. Confirm
curl -X PATCH /tickets/{id}/confirm -H "Authorization: Bearer $TOKEN"

# 5. Check status
curl /tickets/pnr/ABC123
```

## Pro Tips

💡 **Always save PNR** - It's the ticket reference number  
💡 **Check seats first** - Prevents booking failures  
💡 **Confirm promptly** - Reserved status times out  
💡 **Cancel early** - Can't cancel after departure  
💡 **Use search** - Find tickets by multiple criteria  
💡 **Monitor status** - Track ticket lifecycle  

## Quick Debug

```bash
# Check if ticket exists
curl /tickets/pnr/ABC123

# See my tickets
curl /tickets/my-tickets -H "Authorization: Bearer $TOKEN"

# Check seat availability
curl /tickets/available-seats/route-uuid

# Verify route is active
curl /routes/{route-id}
```

## Integration Examples

### With Payment
```javascript
// 1. Create ticket (RESERVED)
const ticket = await createTicket({...});

// 2. Process payment
const payment = await processPayment(ticket.price);

// 3. Confirm if successful
if (payment.success) {
  await confirmTicket(ticket.id);
}
```

### Customer Support
```bash
# Find ticket by PNR
PNR="ABC123"
curl /tickets/pnr/$PNR | jq

# Actions based on status
# - RESERVED: Remind to confirm
# - CONFIRMED: Show details
# - SUSPENDED: Contact admin
# - CANCELLED: Process refund
```

## Response Example

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
    "departureTime": "2025-10-15T08:00:00Z",
    "bus": { "plate": "34ABC123" }
  }
}
```

## Documentation Links

📖 [Full Documentation](TICKET_MODULE_DOCUMENTATION.md)  
📋 [API Examples](TICKET_API_EXAMPLES.md)  
📝 [Complete Summary](TICKET_MODULE_SUMMARY.md)  
🏠 [Main README](README.md)
