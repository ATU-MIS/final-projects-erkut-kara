# Ticket Module - Complete Documentation

## Overview

The Ticket module manages seat bookings with comprehensive features including reservation, confirmation, suspension, cancellation, and double-booking prevention.

## Ticket Fields

- **id** - UUID (auto-generated)
- **pnrNumber** - Unique 6-character PNR code (auto-generated)
- **routeId** - Reference to route
- **userId** - Reference to user who booked (Ticket Owner)
- **issuedById** - Reference to user who performed the booking (Agent/Admin/Self)
- **fromCity** - Departure city
- **toCity** - Destination city
- **seatNumber** - Seat number (1 to bus capacity)
- **gender** - Passenger gender (MALE, FEMALE, OTHER)
- **price** - Ticket price (copied from route)
- **tcKimlikNo** - Turkish ID Number (optional, 11 digits)
- **userPhoneNumber** - Contact phone number
- **passengerName** - Passenger full name
- **status** - Ticket status (RESERVED, CONFIRMED, SUSPENDED, CANCELLED)
- **paymentStatus** - Payment status (PENDING, PAID, REFUNDED)
- **suspendedAt** - Timestamp when suspended (nullable)
- **cancelledAt** - Timestamp when cancelled (nullable)
- **createdAt** - Creation timestamp
- **updatedAt** - Last update timestamp

## Enums

### Gender
- `MALE` - Male passenger
- `FEMALE` - Female passenger
- `OTHER` - Other/prefer not to say

### TicketStatus
- `RESERVED` - Initial booking state
- `CONFIRMED` - Payment completed, booking confirmed
- `SUSPENDED` - Temporarily suspended by admin/agent
- `CANCELLED` - Cancelled by user or admin

### PaymentStatus
- `PENDING` - Awaiting payment
- `PAID` - Payment completed
- `REFUNDED` - Payment refunded after cancellation

## API Endpoints

### Create Ticket (Book Seat)
```http
POST /tickets
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "routeId": "uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "seatNumber": 15,
  "gender": "MALE",
  "userPhoneNumber": "+90 555 123 4567",
  "passengerName": "John Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "pnrNumber": "ABC123",
  "routeId": "uuid",
  "userId": "uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "seatNumber": 15,
  "gender": "MALE",
  "price": 150.00,
  "userPhoneNumber": "+90 555 123 4567",
  "passengerName": "John Doe",
  "status": "RESERVED",
  "paymentStatus": "PENDING",
  "createdAt": "2025-10-14T10:00:00.000Z",
  "route": { ... },
  "user": { ... }
}
```

### List All Tickets (Admin/Agent)
```http
GET /tickets
Authorization: Bearer {token}
Role: ADMIN, AGENT
```

**Query Parameters:**
- `status` - Filter by status
- `paymentStatus` - Filter by payment status
- `userId` - Filter by user

### Search Tickets
```http
GET /tickets/search
```

**Query Parameters:**
- `pnrNumber` - Search by PNR
- `routeId` - Filter by route
- `userId` - Filter by user
- `fromCity` - Filter by departure city
- `toCity` - Filter by destination city
- `status` - Filter by ticket status
- `paymentStatus` - Filter by payment status
- `gender` - Filter by passenger gender
- `userPhoneNumber` - Search by phone number
- `date` - Filter by travel date

### Get My Tickets
```http
GET /tickets/my-tickets
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` - Filter by status (optional)

### Get Available Seats
```http
GET /tickets/available-seats/{routeId}
GET /tickets/available-seats/{routeId}?fromCity=Istanbul&toCity=Ankara
```

**Query Parameters:**
- `fromCity` - Segment start city (optional)
- `toCity` - Segment end city (optional)

If cities are provided, returns seats available for that specific segment (considering segmented booking logic).

**Response:**
```json
[1, 2, 3, 5, 8, 10, 12, 15, ...] // Array of available seat numbers
```

### Find by PNR
```http
GET /tickets/pnr/{pnrNumber}
```

**Example:** `GET /tickets/pnr/ABC123`

### Get Ticket by ID
```http
GET /tickets/{id}
Authorization: Bearer {token}
```

### Update Ticket
```http
PATCH /tickets/{id}
Authorization: Bearer {token}
```

**Request Body (all fields optional):**
```json
{
  "seatNumber": 20,
  "gender": "FEMALE",
  "userPhoneNumber": "+90 555 999 8888",
  "passengerName": "Jane Doe"
}
```

### Confirm Ticket
```http
PATCH /tickets/{id}/confirm
Authorization: Bearer {token}
```

Changes status to CONFIRMED and payment status to PAID.

### Suspend Ticket (Admin/Agent)
```http
PATCH /tickets/{id}/suspend
Authorization: Bearer {token}
Role: ADMIN, AGENT
```

Temporarily suspends the ticket.

### Cancel Ticket
```http
PATCH /tickets/{id}/cancel
Authorization: Bearer {token}
```

Cancels the ticket and initiates refund if paid.

### Get Statistics (Admin/Agent)
```http
GET /tickets/stats
Authorization: Bearer {token}
Role: ADMIN, AGENT
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

## Business Logic

### 1. Segmented Booking (Stop-based Availability)

The system manages seat availability based on route segments (stops). 

- **Logic**: A seat is considered "occupied" only if an existing ticket overlaps with the requested journey segment.
- **Example**: 
  - Route: A -> B -> C -> D
  - Ticket 1: A -> B (Seat 15)
  - User Request: C -> D (Seat 15) -> **Allowed** (No overlap)
  - User Request: A -> C (Seat 15) -> **Denied** (Overlaps A->B)

- **Implementation**:
  - `fromStopIndex`: Index of departure city in the full route list
  - `toStopIndex`: Index of arrival city
  - Overlap Check: `(Existing.Start < New.End) AND (Existing.End > New.Start)`

### 2. Double Booking Prevention

The system prevents booking the same seat twice on the same **segment**:

```typescript
// Old: @@unique([routeId, seatNumber]) - Removed
// New: Logic check in Service
```

- Before creating a ticket, checks if seat is already booked **for the specific segment**
- Only RESERVED and CONFIRMED tickets block seats
- CANCELLED and SUSPENDED tickets don't block seats

### 3. PNR Generation

- Auto-generates unique 6-character alphanumeric PNR
- Format: A-Z and 0-9 characters
- Example: `ABC123`, `XYZ789`
- Guaranteed unique in database

### 3. Price Calculation

- Automatically fetched from route price
- Cannot be manually set during booking
- Ensures price consistency

### 4. Seat Number Validation

- Must be between 1 and bus seat count
- Validates against bus capacity
- Prevents invalid seat numbers

### 5. Permission System

| Action | Customer | Agent | Admin |
|--------|----------|-------|-------|
| Create | ✅ Own | ✅ Any | ✅ Any |
| View Own | ✅ | ✅ | ✅ |
| View All | ❌ | ✅ | ✅ |
| Update | ✅ Own | ❌ | ✅ Any |
| Confirm | ✅ Own | ❌ | ✅ Any |
| Suspend | ❌ | ✅ | ✅ |
| Cancel | ✅ Own | ❌ | ✅ Any |

### 6. Status Transitions

```
RESERVED → CONFIRMED (payment)
RESERVED → SUSPENDED (admin action)
RESERVED → CANCELLED (user/admin action)
CONFIRMED → SUSPENDED (admin action)
CONFIRMED → CANCELLED (user/admin action)
SUSPENDED → CONFIRMED (admin action)
SUSPENDED → CANCELLED (admin action)
```

### 7. Cancellation Rules

- ✅ Can cancel before route departure
- ❌ Cannot cancel after route has departed
- ✅ Paid tickets get REFUNDED status
- ✅ Pending tickets stay PENDING

### 8. Booking Time Restrictions (15-Minute Rule)

- **Customers:** Cannot book tickets if departure time is less than 15 minutes away.
- **Agents/Admins:** Can book tickets at any time (even after departure).

### 9. Update Restrictions

- ❌ Cannot update cancelled tickets
- ✅ Can change seat if new seat is available
- ✅ Can update passenger details
- ✅ Only owner or admin can update

## Validation Rules

### Create Ticket
- `routeId` - Required, valid UUID, route must exist and be active
- `fromCity` - Required, string
- `toCity` - Required, string
- `seatNumber` - Required, integer, min 1, must be within bus capacity
- `gender` - Required, enum (MALE, FEMALE, OTHER)
- `userPhoneNumber` - Required, string
- `passengerName` - Required, string

### Update Ticket
- All fields optional
- `seatNumber` - If changing, new seat must be available
- Cannot update cancelled tickets

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid seat number. Bus has only 48 seats",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Route with ID {id} not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Seat 15 is already booked on this route",
  "error": "Conflict"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You can only cancel your own tickets",
  "error": "Forbidden"
}
```

## Database Indexes

Optimized for performance:

```sql
@@unique([routeId, seatNumber])  -- Prevent double booking
@@index([pnrNumber])              -- Fast PNR lookup
@@index([routeId, status])        -- Query tickets by route
@@index([userId])                 -- User ticket lookup
```

## Use Cases

### Customer Booking Flow
```
1. Search routes → GET /routes/search
2. Check available seats → GET /tickets/available-seats/{routeId}
3. Book ticket → POST /tickets
4. Receive PNR → Response contains pnrNumber
5. Make payment → PATCH /tickets/{id}/confirm
6. Get confirmation → Status: CONFIRMED
```

### Admin Management
```
1. View all tickets → GET /tickets
2. Search by PNR → GET /tickets/pnr/{pnr}
3. Suspend ticket → PATCH /tickets/{id}/suspend
4. View stats → GET /tickets/stats
```

### Customer After Booking
```
1. View my tickets → GET /tickets/my-tickets
2. Check by PNR → GET /tickets/pnr/{pnr}
3. Cancel if needed → PATCH /tickets/{id}/cancel
```

## Integration with Other Modules

### With Route Module
- Validates route exists and is active
- Fetches price from route
- Checks route departure time for cancellation
- Includes full route details in responses

### With Bus Module
- Validates seat number against bus capacity
- Uses bus seat count for available seats calculation

### With User Module
- Associates ticket with authenticated user
- Includes user details in ticket responses
- Manages user permissions

### With Auth Module
- JWT authentication required
- Role-based access control
- User identification for booking

## Best Practices

### For Customers
1. Check available seats before booking
2. Save your PNR number
3. Confirm payment promptly
4. Cancel early if plans change
5. Verify passenger details before booking

### For Admins
1. Monitor suspended tickets
2. Handle refunds for cancelled tickets
3. Review booking patterns
4. Check statistics regularly
5. Suspend fraudulent bookings

### For Developers
1. Always check seat availability
2. Validate route is active
3. Handle concurrent bookings gracefully
4. Log all ticket operations
5. Implement proper error handling

## Example Scenarios

### Scenario 1: Successful Booking
```bash
# 1. Check available seats
GET /tickets/available-seats/route-uuid
# Response: [1, 2, 3, ..., 48]

# 2. Book seat
POST /tickets
{
  "routeId": "route-uuid",
  "seatNumber": 15,
  ...
}
# Response: PNR "ABC123", Status: RESERVED

# 3. Confirm booking
PATCH /tickets/{id}/confirm
# Response: Status: CONFIRMED, Payment: PAID
```

### Scenario 2: Double Booking Prevented
```bash
# User A books seat 15
POST /tickets { "seatNumber": 15 }
# Success: PNR "ABC123"

# User B tries to book seat 15
POST /tickets { "seatNumber": 15 }
# Error 409: "Seat 15 is already booked"
```

### Scenario 3: Cancellation with Refund
```bash
# Cancel confirmed ticket
PATCH /tickets/{id}/cancel
# Response: Status: CANCELLED, Payment: REFUNDED
```

## Performance Considerations

- Unique constraint on (routeId, seatNumber) prevents race conditions
- Indexes optimize seat availability queries
- PNR generation has collision retry logic
- Batch operations possible for route-level queries

## Security Features

- JWT authentication required for most endpoints
- Role-based access control
- User can only modify own tickets
- Admin override for all operations
- Prevents booking on departed routes
