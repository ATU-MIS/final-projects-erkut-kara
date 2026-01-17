# Route Module - Complete Summary

## Overview

The Route module is a comprehensive system for managing bus routes with advanced search capabilities, time conflict prevention, and detailed analytics.

## Key Features

### ✅ Core Functionality
- **CRUD Operations** - Create, Read, Update, Delete routes
- **Advanced Search** - Multi-criteria search with pagination
- **Time Management** - DateTime-based departure and arrival
- **Bus Assignment** - Link routes to specific buses
- **Station Management** - Support for intermediate stops
- **Route Types** - STANDARD, EXPRESS, VIP, LUXURY

### ✅ Business Logic
- **Conflict Prevention** - Prevents double-booking of buses
- **Time Validation** - Ensures arrival after departure
- **Available Seats** - Real-time calculation of open seats
- **Duration Calculation** - Automatic trip duration computation

### ✅ Advanced Features
- **Upcoming Routes** - Find routes in next N days
- **Popular Routes** - Sort by ticket sales
- **Statistics** - Route analytics by type and status
- **Pagination** - Efficient data retrieval

## Database Schema

### Route Table
```sql
CREATE TABLE routes (
  id            UUID PRIMARY KEY,
  fromCity      VARCHAR(255) NOT NULL,
  toCity        VARCHAR(255) NOT NULL,
  stations      TEXT[],
  departureTime TIMESTAMP NOT NULL,
  arrivalTime   TIMESTAMP NOT NULL,
  price         DECIMAL(10, 2) NOT NULL,
  type          RouteType DEFAULT 'STANDARD',
  busId         UUID NOT NULL REFERENCES buses(id),
  isActive      BOOLEAN DEFAULT true,
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_routes_cities ON routes(fromCity, toCity);
CREATE INDEX idx_routes_departure ON routes(departureTime);
```

### RouteType Enum
- `STANDARD` - Regular service
- `EXPRESS` - Fast service with fewer stops
- `VIP` - Premium service
- `LUXURY` - Top-tier service

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/routes` | Admin/Agent | Create new route |
| GET | `/routes` | Public | List all routes |
| GET | `/routes/stations` | Public | Get unique stations list (Special JSON format) |
| GET | `/routes/search` | Public | Search routes |
| GET | `/routes/:id` | Public | Get route details |
| GET | `/routes/upcoming` | Public | Get upcoming routes |
| GET | `/routes/popular` | Public | Get popular routes |
| GET | `/routes/stats` | Admin/Agent | Get statistics |
| PATCH | `/routes/:id` | Admin/Agent | Update route |
| DELETE | `/routes/:id` | Admin | Delete route |

## Search Capabilities

### Supported Filters
- **City Search** - fromCity, toCity (case-insensitive, partial match)
- **Date Search** - Specific departure date
- **Price Range** - Min/max price filters
- **Route Type** - Filter by service level
- **Bus Filter** - Routes for specific bus
- **Status Filter** - Active/inactive routes
- **Pagination** - Page and limit controls

### Example Searches
```javascript
// Simple city search
GET /routes/search?fromCity=Istanbul&toCity=Ankara

// Date-specific search
GET /routes/search?fromCity=Istanbul&date=2025-10-15

// Price range with type
GET /routes/search?minPrice=100&maxPrice=200&type=EXPRESS

// Combined search
GET /routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15&type=VIP&maxPrice=300
```

## Business Rules

### 1. Time Conflict Prevention
When creating or updating a route, the system checks if the assigned bus is already on another active route during the same time period.

**Conflict Detection:**
```
New Route: 08:00 - 14:00
Existing Route: 10:00 - 16:00
Result: CONFLICT (overlapping times)
```

### 2. Time Validation
Arrival time must be after departure time.

```javascript
// Valid
departureTime: "2025-10-15T08:00:00Z"
arrivalTime: "2025-10-15T14:00:00Z"

// Invalid
departureTime: "2025-10-15T14:00:00Z"
arrivalTime: "2025-10-15T08:00:00Z"
```

### 3. Available Seats Calculation
```
availableSeats = bus.seatCount - ticketCount
```

Automatically calculated in search results to help users find routes with available capacity.

### 4. Duration Calculation
```
duration = arrivalTime - departureTime
Format: "Xh Ym"
Example: "6h 30m"
```

### 5. Delete Protection
Routes with tickets cannot be deleted to maintain data integrity. Users must cancel/refund all tickets first.

## Module Structure

```
src/modules/route/
├── dto/
│   ├── create-route.dto.ts    # Validation for creating routes
│   ├── update-route.dto.ts    # Validation for updating routes
│   └── search-route.dto.ts    # Validation for search queries
├── route.controller.ts         # HTTP endpoints
├── route.service.ts            # Business logic
└── route.module.ts             # Module definition
```

## DTO Validation

### CreateRouteDto
```typescript
{
  fromCity: string;           // Required
  toCity: string;             // Required
  stations: string[];         // Optional array
  departureTime: string;      // Required ISO 8601
  arrivalTime: string;        // Required ISO 8601
  price: number;              // Required, min 0
  type: RouteType;            // Optional, default STANDARD
  busId: string;              // Required UUID
}
```

### SearchRouteDto
```typescript
{
  fromCity?: string;          // Optional partial match
  toCity?: string;            // Optional partial match
  date?: string;              // Optional ISO date
  type?: RouteType;           // Optional enum
  minPrice?: number;          // Optional, min 0
  maxPrice?: number;          // Optional, min 0
  busId?: string;             // Optional UUID
  isActive?: string;          // Optional "true"/"false"
  page?: number;              // Optional, min 1
  limit?: number;             // Optional, min 1, max 100
}
```

## Response Formats

### Single Route
```json
{
  "id": "uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "stations": ["Izmit", "Bolu"],
  "departureTime": "2025-10-15T08:00:00.000Z",
  "arrivalTime": "2025-10-15T14:00:00.000Z",
  "price": 150,
  "type": "EXPRESS",
  "busId": "bus-uuid",
  "isActive": true,
  "bus": { ... },
  "tickets": [ ... ]
}
```

### Paginated List
```json
{
  "data": [ ... routes ... ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Search Result with Enhancements
```json
{
  "data": [
    {
      ...route fields...,
      "availableSeats": 33,
      "duration": "6h 0m",
      "bus": { ... },
      "_count": {
        "tickets": 15
      }
    }
  ],
  "meta": { ... }
}
```

## Service Methods

### Core CRUD
- `create(createRouteDto)` - Create route with validation
- `findAll(params)` - List routes with filters
- `findOne(id)` - Get single route with details
- `update(id, updateRouteDto)` - Update route
- `remove(id)` - Delete route (protected)

### Search & Discovery
- `search(searchDto)` - Advanced multi-criteria search
- `getUpcomingRoutes(fromCity, toCity, days)` - Future routes
- `getPopularRoutes(limit)` - Top routes by tickets

### Analytics
- `getRouteStats()` - Statistics by type and status

### Utilities
- `calculateDuration(departure, arrival)` - Format duration

## Integration Points

### With Bus Module
- Validates bus exists before assignment
- Includes bus details (with specs) in responses
- Uses bus.seatCount for availability calculation

### With Ticket Module (Future)
- Counts tickets for availability
- Lists tickets in route details
- Prevents deletion of routes with tickets

### With Auth Module
- JWT authentication for protected routes
- Role-based access (Admin, Agent, Customer)

## Performance Optimizations

### Database Indexes
- **Composite Index**: (fromCity, toCity) for city pair searches
- **Single Index**: departureTime for date queries and sorting

### Pagination
- Default: 20 results per page
- Maximum: 100 results per page
- Prevents loading entire dataset

### Query Optimization
- Uses Prisma's `include` for eager loading
- Counts tickets in single query with `_count`
- Parallel queries for list + total count

## Use Cases

### 1. Customer Search Flow
```
1. User searches: Istanbul → Ankara, 2025-10-15
2. System returns routes with available seats
3. User selects route with best price/time
4. System shows seat layout from bus
5. User books ticket
```

### 2. Admin Route Management
```
1. Check daily stats
2. Create new routes for next week
3. Update prices based on demand
4. Deactivate cancelled routes
5. View popular routes for planning
```

### 3. Agent Operations
```
1. Search upcoming routes
2. Check seat availability
3. Create special routes for events
4. Update route details
5. Generate reports
```

## Error Handling

### Common Errors
- **400 Bad Request** - Invalid times, validation errors
- **404 Not Found** - Route or bus not found
- **409 Conflict** - Bus time conflict, delete with tickets
- **401 Unauthorized** - Missing/invalid token
- **403 Forbidden** - Insufficient permissions

## Testing Examples

### Create Route Test
```bash
# Valid route
POST /routes
{
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "departureTime": "2025-10-15T08:00:00Z",
  "arrivalTime": "2025-10-15T14:00:00Z",
  "price": 150,
  "busId": "valid-bus-id"
}
# Expected: 201 Created

# Invalid times
POST /routes
{
  "departureTime": "2025-10-15T14:00:00Z",
  "arrivalTime": "2025-10-15T08:00:00Z",
  ...
}
# Expected: 400 Bad Request
```

### Search Test
```bash
# City search
GET /routes/search?fromCity=Istanbul&toCity=Ankara
# Expected: List of matching routes

# Date search
GET /routes/search?date=2025-10-15
# Expected: Routes on that date

# Combined search
GET /routes/search?fromCity=Istanbul&date=2025-10-15&maxPrice=200
# Expected: Filtered results
```

## Best Practices

### For Admins
1. Create routes with reasonable time buffers
2. Assign VIP/LUXURY types to premium buses
3. Use intermediate stations wisely
4. Monitor popular routes for capacity planning
5. Deactivate instead of delete when possible

### For Developers
1. Always validate bus availability before assignment
2. Use pagination for large result sets
3. Include bus details in route responses
4. Calculate available seats for user display
5. Handle timezone considerations properly

## Future Enhancements

### Planned Features
- [ ] Recurring route templates
- [ ] Dynamic pricing based on demand
- [ ] Route optimization algorithms
- [ ] Real-time seat availability via WebSocket
- [ ] Route recommendations
- [ ] Multi-language city names
- [ ] Weather integration
- [ ] Traffic delay notifications

## Migration Guide

After pulling the route module:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Create migration
npm run prisma:migrate
# Name: "add_route_module"

# 3. Verify schema
npm run prisma:studio

# 4. Test endpoints
npm run start:dev
curl http://localhost:3000/routes
```

## Summary

The Route module provides a robust, feature-rich system for managing bus routes with:
- ✅ Complete CRUD operations
- ✅ Advanced search with 8+ filters
- ✅ Time conflict prevention
- ✅ Automatic calculations (seats, duration)
- ✅ Role-based access control
- ✅ Comprehensive validation
- ✅ Optimized database queries
- ✅ Extensive documentation

Perfect foundation for a production bus ticketing system! 🚌
