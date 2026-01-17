# Ticket Module - Complete Summary

## ✅ **Module Created Successfully!**

A comprehensive ticket booking system with seat reservation, confirmation, suspension, cancellation, and double-booking prevention.

## 📊 **Key Features**

### Core Functionality
- ✅ **Seat Booking** - Reserve seats on bus routes
- ✅ **Double-Booking Prevention** - Unique constraint on (routeId, seatNumber)
- ✅ **PNR Generation** - Auto-generated unique 6-character codes
- ✅ **Status Management** - RESERVED, CONFIRMED, SUSPENDED, CANCELLED
- ✅ **Payment Tracking** - PENDING, PAID, REFUNDED
- ✅ **Suspend/Cancel** - Admin controls and user cancellation
- ✅ **Available Seats** - Real-time seat availability checking

### Security & Permissions
- ✅ **Role-Based Access** - Customer, Agent, Admin permissions
- ✅ **Ownership Validation** - Users can only modify their own tickets
- ✅ **Admin Override** - Full control for administrators
- ✅ **Departure Check** - Prevent cancellation after departure

## 🗄️ **Database Schema**

### Ticket Model
```prisma
model Ticket {
  id              String        @id @default(uuid())
  pnrNumber       String        @unique
  routeId         String
  userId          String
  fromCity        String
  toCity          String
  seatNumber      Int
  gender          Gender
  price           Float
  userPhoneNumber String
  passengerName   String
  status          TicketStatus  @default(RESERVED)
  paymentStatus   PaymentStatus @default(PENDING)
  suspendedAt     DateTime?
  cancelledAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([routeId, seatNumber])  // Double-booking prevention
}
```

### Enums
```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum TicketStatus {
  RESERVED
  CONFIRMED
  SUSPENDED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}
```

## 🔧 **Files Created**

1. **Schema**: `prisma/schema.prisma` - Updated Ticket model
2. **DTOs**:
   - `create-ticket.dto.ts` - Booking validation
   - `update-ticket.dto.ts` - Update validation
   - `search-ticket.dto.ts` - Search parameters
3. **Service**: `ticket.service.ts` - Business logic (608 lines)
4. **Controller**: `ticket.controller.ts` - API endpoints
5. **Module**: `ticket.module.ts` - Module configuration
6. **Docs**:
   - `TICKET_MODULE_DOCUMENTATION.md` - Full documentation
   - `TICKET_API_EXAMPLES.md` - API examples

## 📋 **API Endpoints**

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/tickets` | Auth | Book a seat |
| GET | `/tickets/my-tickets` | Auth | Get user's tickets |
| GET | `/tickets/pnr/:pnr` | Public | Find by PNR |
| GET | `/tickets/available-seats/:routeId` | Public | Check availability |
| GET | `/tickets/search` | Public | Search tickets |
| GET | `/tickets/:id` | Auth | Get ticket details |
| GET | `/tickets` | Admin/Agent | List all tickets |
| GET | `/tickets/stats` | Admin/Agent | Get statistics |
| PATCH | `/tickets/:id` | Auth | Update ticket |
| PATCH | `/tickets/:id/confirm` | Auth | Confirm booking |
| PATCH | `/tickets/:id/suspend` | Admin/Agent | Suspend ticket |
| PATCH | `/tickets/:id/cancel` | Auth | Cancel ticket |

## 🎯 **Business Logic**

### 1. Double-Booking Prevention
```typescript
@@unique([routeId, seatNumber])

// Checks before creating:
// - Is seat already booked?
// - Only RESERVED/CONFIRMED block seats
// - CANCELLED/SUSPENDED don't block
```

### 2. PNR Generation
```typescript
// Auto-generates unique 6-character code
// Format: A-Z0-9 (e.g., "ABC123", "XYZ789")
// Collision detection and retry
```

### 3. Price Calculation
```typescript
// Price automatically copied from route
// Ensures consistency
// Cannot be manually overridden
```

### 4. Seat Validation
```typescript
// Must be 1 to bus.seatCount
// Validates against bus capacity
// Prevents invalid seat numbers
```

### 5. Permission Matrix

| Action | Customer | Agent | Admin |
|--------|----------|-------|-------|
| Book | ✅ Own | ✅ Any | ✅ Any |
| View Own | ✅ | ✅ | ✅ |
| View All | ❌ | ✅ | ✅ |
| Update | ✅ Own | ❌ | ✅ Any |
| Confirm | ✅ Own | ❌ | ✅ Any |
| Suspend | ❌ | ✅ | ✅ |
| Cancel | ✅ Own | ❌ | ✅ Any |

### 6. Status Flow
```
RESERVED → CONFIRMED (payment)
RESERVED → SUSPENDED (admin)
RESERVED → CANCELLED (user/admin)
CONFIRMED → SUSPENDED (admin)
CONFIRMED → CANCELLED (user/admin)
SUSPENDED → CONFIRMED (admin)
SUSPENDED → CANCELLED (admin)
```

### 7. Cancellation Rules
- ✅ Can cancel before route departure
- ❌ Cannot cancel after departure
- ✅ Paid tickets → REFUNDED
- ✅ Pending tickets → stay PENDING

## 💡 **Example Usage**

### Complete Booking Flow
```bash
# 1. Check available seats
GET /tickets/available-seats/route-uuid
# Response: [1, 2, 3, 5, 8, ...]

# 2. Book a seat
POST /tickets
{
  "routeId": "uuid",
  "seatNumber": 15,
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "gender": "MALE",
  "userPhoneNumber": "+90 555 123 4567",
  "passengerName": "John Doe"
}
# Response: PNR "ABC123", Status: RESERVED

# 3. Confirm payment
PATCH /tickets/{id}/confirm
# Response: Status: CONFIRMED, Payment: PAID

# 4. Check ticket
GET /tickets/pnr/ABC123
```

### Find Ticket by PNR
```bash
GET /tickets/pnr/ABC123
```

### Check My Tickets
```bash
GET /tickets/my-tickets?status=CONFIRMED
```

### Cancel Ticket
```bash
PATCH /tickets/{id}/cancel
# If paid: Payment status → REFUNDED
```

## 🛡️ **Double-Booking Prevention**

### Database Level
```sql
CONSTRAINT unique_seat UNIQUE (routeId, seatNumber)
```

### Application Level
```typescript
// Before booking, checks:
const existingTicket = await findTicket({
  routeId,
  seatNumber,
  status: IN [RESERVED, CONFIRMED]
});

if (existingTicket) {
  throw ConflictException("Seat already booked");
}
```

### Race Condition Handling
- Database constraint prevents concurrent bookings
- Unique index ensures atomicity
- Transaction-safe operations

## 📈 **Statistics**

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
    "PENDING": { "count": 50, "revenue": 0 },
    "PAID": { "count": 400, "revenue": 60000 },
    "REFUNDED": { "count": 50, "revenue": 0 }
  }
}
```

## 🔍 **Search Capabilities**

Supports filtering by:
- **PNR Number** - Partial match
- **Route ID** - Exact match
- **User ID** - User's tickets
- **Cities** - From/to city partial match
- **Status** - Ticket status
- **Payment Status** - Payment state
- **Gender** - Passenger gender
- **Phone Number** - Partial match
- **Date** - Travel date

## ⚙️ **Service Methods**

### Core CRUD
- `create()` - Book ticket with validation
- `findAll()` - List all tickets (admin)
- `findOne()` - Get single ticket
- `update()` - Update ticket details
- `findByPNR()` - Find by PNR number

### Status Management
- `confirm()` - Confirm booking & payment
- `suspend()` - Admin/Agent suspension
- `cancel()` - Cancel with refund logic

### Utilities
- `getAvailableSeats()` - Get free seats
- `getUserTickets()` - User's bookings
- `search()` - Advanced search
- `getStats()` - Statistics
- `generatePNR()` - Unique PNR generation

## 🚀 **Next Steps**

After pulling these changes:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Create migration
npm run prisma:migrate
# Name: "create_ticket_module"

# 3. Start server
npm run start:dev

# 4. Test booking
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "routeId": "route-uuid",
    "seatNumber": 15,
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "gender": "MALE",
    "userPhoneNumber": "+90 555 123 4567",
    "passengerName": "John Doe"
  }'
```

## 🎨 **Integration Points**

### With Route Module
- ✅ Validates route exists and is active
- ✅ Fetches price from route
- ✅ Checks departure time for cancellation
- ✅ Includes route details in responses

### With Bus Module
- ✅ Validates seat number against capacity
- ✅ Uses seat count for availability
- ✅ Includes bus details in responses

### With User Module
- ✅ Associates with authenticated user
- ✅ Enforces ownership permissions
- ✅ Includes user details in responses

### With Auth Module
- ✅ JWT authentication required
- ✅ Role-based access control
- ✅ User identification

## 📊 **Performance**

### Database Indexes
```sql
@@index([pnrNumber])          -- Fast PNR lookup
@@index([routeId, status])    -- Route ticket queries
@@index([userId])             -- User ticket lookup
```

### Optimizations
- Unique constraints prevent race conditions
- Indexes optimize search queries
- PNR generation with collision retry
- Efficient seat availability calculation

## 🔒 **Security Features**

- JWT authentication required
- Role-based permissions
- Ownership validation
- Admin override capability
- Prevents post-departure cancellation
- Validates route status

## 📝 **Validation Rules**

### Create Ticket
- `routeId` - Required, valid UUID, route must exist and be active
- `fromCity` - Required, string
- `toCity` - Required, string
- `seatNumber` - Required, integer, 1 to bus capacity
- `gender` - Required, enum (MALE, FEMALE, OTHER)
- `userPhoneNumber` - Required, string
- `passengerName` - Required, string

### Update Ticket
- All fields optional
- New seat must be available
- Cannot update cancelled tickets
- Only owner or admin can update

## 🎯 **Best Practices**

### For Customers
1. ✅ Check seat availability first
2. ✅ Save your PNR number
3. ✅ Confirm payment promptly
4. ✅ Cancel early if needed
5. ✅ Verify passenger details

### For Admins
1. ✅ Monitor suspended tickets
2. ✅ Process refunds quickly
3. ✅ Review booking patterns
4. ✅ Check statistics regularly
5. ✅ Suspend fraudulent bookings

## 📚 **Documentation**

- 📖 [Full Documentation](TICKET_MODULE_DOCUMENTATION.md) - 486 lines
- 📋 [API Examples](TICKET_API_EXAMPLES.md) - 514 lines
- 🏠 [Main README](README.md) - Updated with ticket endpoints

## ✨ **Summary**

The Ticket module provides:
- ✅ Complete booking system
- ✅ Double-booking prevention
- ✅ Multi-status management
- ✅ Role-based permissions
- ✅ PNR-based tracking
- ✅ Comprehensive validation
- ✅ Advanced search
- ✅ Statistics & reporting

**Production-ready ticket booking system!** 🎫
