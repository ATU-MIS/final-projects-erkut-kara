# Route Module API Documentation

## Overview

The Route module manages bus routes with detailed information including departure/arrival times, cities, stations, pricing, and bus assignments.

## Route Fields

- **id** - UUID (auto-generated)
- **fromCity** - Departure city
- **toCity** - Destination city
- **stations** - Array of intermediate stations
- **departureTime** - DateTime of departure
- **arrivalTime** - DateTime of arrival
- **price** - Route price
- **type** - Route type (STANDARD, EXPRESS, VIP, LUXURY)
- **busId** - Reference to assigned bus
- **captainName** - Name of the captain/head driver
- **firstDriverName** - Name of the first driver
- **secondDriverName** - Name of the second driver
- **assistantName** - Name of the assistant (muavin)
- **restStops** - Array of rest facilities/stops (e.g. ["Düzce Tesisleri", "Bolu Dağı"])
- **isActive** - Active status (default: true)
- **createdAt** - Timestamp
- **updatedAt** - Timestamp

## Route Types

- **STANDARD** - Regular service with standard amenities
- **EXPRESS** - Faster service with fewer stops
- **VIP** - Premium service with luxury amenities
- **LUXURY** - Top-tier service with maximum comfort

## Segmented Pricing & Availability (New)

The system supports defining different prices and availability for specific segments of a route.

### Example Configuration

For a route: **Istanbul -> Izmit -> Bolu -> Ankara**

You can define:
- Istanbul -> Izmit: 100 TL
- Izmit -> Bolu: 150 TL
- Istanbul -> Bolu: 250 TL
- Izmit -> Gebze: **Not Sold** (`isSold: false`)

### How it works
1. **Search**: When a user searches for "Izmit to Gebze", if `isSold` is false, the route will not appear.
2. **Pricing**: If a specific price is defined for "Istanbul -> Bolu", that price is used. Otherwise, it falls back to the main route price.
3. **Availability**: The system checks seat availability only for the requested segment. A seat can be sold multiple times if segments don't overlap (e.g., Passenger A: Istanbul->Izmit, Passenger B: Bolu->Ankara).

## API Endpoints

### Create Route (with Segments)
```http
POST /routes
```

**Request Body:**
```json
{
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "stations": ["Izmit", "Bolu"],
  "price": 500,
  "prices": [
    {
      "fromCity": "Istanbul",
      "toCity": "Izmit",
      "price": 100,
      "isSold": true
    },
    {
      "fromCity": "Izmit",
      "toCity": "Gebze",
      "price": 0,
      "isSold": false
    }
  ],
  ...
}
```

### List All Routes
"stations": ["Izmit", "Bolu"],
  "departureTime": "2025-10-15T08:00:00Z",
  "arrivalTime": "2025-10-15T14:00:00Z",
  "price": 150.00,
  "type": "EXPRESS",
  "busId": "uuid-of-bus"
}
```

**Response:**
```json
{
  "id": "uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "stations": ["Izmit", "Bolu"],
  "departureTime": "2025-10-15T08:00:00.000Z",
  "arrivalTime": "2025-10-15T14:00:00.000Z",
  "price": 150.00,
  "type": "EXPRESS",
  "busId": "uuid-of-bus",
  "isActive": true,
  "createdAt": "2025-10-14T10:00:00.000Z",
  "updatedAt": "2025-10-14T10:00:00.000Z",
  "bus": {
    "id": "uuid",
    "plate": "34ABC123",
    "model": "Travego 17 SHD",
    "seatCount": 48,
    "layoutType": "LAYOUT_2_1",
    "specs": { ... }
  }
}
```

### List All Routes
```http
GET /routes
GET /routes?isActive=true
GET /routes?type=EXPRESS
GET /routes?page=1&limit=20
```

**Query Parameters:**
- `isActive` - Filter by active status (true/false)
- `type` - Filter by route type
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fromCity": "Istanbul",
      "toCity": "Ankara",
      ...
      "bus": { ... },
      "_count": {
        "tickets": 15
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Search Routes
```http
GET /routes/search
GET /routes/search?fromCity=Istanbul&toCity=Ankara
GET /routes/search?date=2025-10-15
GET /routes/search?minPrice=100&maxPrice=200
```

**Query Parameters:**
- `fromCity` - Search by departure city (partial match)
- `toCity` - Search by destination city (partial match)
- `date` - Search by departure date (YYYY-MM-DD)
- `type` - Filter by route type
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `busId` - Filter by specific bus
- `isActive` - Filter by active status (default: true for public searches)
- `page` - Page number
- `limit` - Results per page

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fromCity": "Istanbul",
      "toCity": "Ankara",
      "stations": ["Izmit", "Bolu"],
      "departureTime": "2025-10-15T08:00:00.000Z",
      "arrivalTime": "2025-10-15T14:00:00.000Z",
      "price": 150.00,
      "type": "EXPRESS",
      "availableSeats": 33,
      "duration": "6h 0m",
      "bus": { ... }
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Route by ID
```http
GET /routes/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "stations": ["Izmit", "Bolu"],
  "departureTime": "2025-10-15T08:00:00.000Z",
  "arrivalTime": "2025-10-15T14:00:00.000Z",
  "price": 150.00,
  "type": "EXPRESS",
  "busId": "uuid",
  "isActive": true,
  "bus": { ... },
  "tickets": [
    {
      "id": "uuid",
      "seatNumber": 1,
      "status": "CONFIRMED"
    }
  ]
}
```

### Update Route
```http
PATCH /routes/{id}
Authorization: Bearer {token}
Role: ADMIN, AGENT
```

**Request Body (all fields optional):**
```json
{
  "price": 160.00,
  "departureTime": "2025-10-15T09:00:00Z",
  "arrivalTime": "2025-10-15T15:00:00Z",
  "isActive": false
}
```

### Delete Route
```http
DELETE /routes/{id}
Authorization: Bearer {token}
Role: ADMIN
```

**Note:** Cannot delete routes with tickets. Cancel/refund tickets first.

### Get Upcoming Routes
```http
GET /routes/upcoming
GET /routes/upcoming?fromCity=Istanbul&toCity=Ankara
GET /routes/upcoming?days=14
```

**Query Parameters:**
- `fromCity` - Filter by departure city
- `toCity` - Filter by destination city
- `days` - Number of days ahead (default: 7)

**Response:**
```json
[
  {
    "id": "uuid",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "departureTime": "2025-10-15T08:00:00.000Z",
    ...
  }
]
```

### Get Popular Routes
```http
GET /routes/popular
GET /routes/popular?limit=5
```

**Query Parameters:**
- `limit` - Number of routes to return (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "_count": {
      "tickets": 150
    },
    ...
  }
]
```

### Get Route Statistics
```http
GET /routes/stats
Authorization: Bearer {token}
Role: ADMIN, AGENT
```

**Response:**
```json
{
  "total": 100,
  "active": 85,
  "inactive": 15,
  "byType": {
    "STANDARD": 40,
    "EXPRESS": 35,
    "VIP": 15,
    "LUXURY": 10
  }
}
```

## Validation Rules

### Create Route
- `fromCity` - Required, string
- `toCity` - Required, string
- `stations` - Optional, array of strings
- `departureTime` - Required, ISO 8601 date string
- `arrivalTime` - Required, ISO 8601 date string (must be after departureTime)
- `price` - Required, number, minimum 0
- `type` - Optional, enum (STANDARD, EXPRESS, VIP, LUXURY)
- `busId` - Required, valid UUID of existing bus
- Bus must not be assigned to another route during the same time period

### Update Route
- All fields optional
- Same validation as create for provided fields

## Business Rules & Integrity Checks

### 1. 15-Minute Cutoff (Search & Booking)
- **Search:** Routes departing within the next 15 minutes are hidden from public search results (based on the user's departure city).
- **Booking (Customer):** Customers cannot book tickets for a route departing in less than 15 minutes.
- **Booking (Agent/Admin):** Agents and Admins can override this rule and sell tickets until the last moment (or even after departure).

### 2. Route Integrity Protection
Once a ticket is sold (RESERVED or CONFIRMED), the system locks critical route details to prevent data corruption:
- ❌ **Cannot change stations:** Preventing index mismatch for existing tickets.
- ❌ **Cannot change Origin/Destination:** Preventing index mismatch.
- ❌ **Cannot reduce capacity:** Cannot assign a bus smaller than the highest sold seat number.

### 3. Time Conflict Prevention
When creating/updating a route, the system checks if the bus is already assigned to another route during the same time period. This prevents double-booking of buses.

### 4. Night Route Handling
Routes departing between 00:00 and 03:00 are automatically flagged with a `dateInfo` message (e.g., "Salı'yı Çarşamba'ya bağlayan gece") to prevent date confusion.

### Available Seats Calculation
Search results include `availableSeats` calculated as:
```
availableSeats = bus.seatCount - ticketCount
```

### Duration Calculation
Search results include `duration` in format "Xh Ym" calculated from departure and arrival times.

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Arrival time must be after departure time",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Bus with ID {id} not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Bus is already assigned to another route during this time period",
  "error": "Conflict"
}
```

## Use Cases

### Customer Journey
1. **Search Routes**: Use `/routes/search` with fromCity, toCity, and date
2. **View Details**: Get route details with `/routes/{id}` to see available seats
3. **Book Ticket**: Create ticket for selected route

### Admin Management
1. **Create Route**: POST to `/routes` with bus assignment
2. **Monitor Stats**: GET `/routes/stats` for overview
3. **Update Route**: PATCH `/routes/{id}` to adjust price or schedule
4. **Deactivate**: Update `isActive: false` instead of deleting

## Index Optimization

The schema includes indexes on:
- `fromCity, toCity` - For fast city pair searches
- `departureTime` - For date-based queries and sorting

## Example Workflows

### Creating a Daily Route
```bash
# Create route for tomorrow at 8 AM
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Istanbul",
    "toCity": "Izmir",
    "stations": ["Bursa", "Balikesir"],
    "departureTime": "2025-10-15T08:00:00Z",
    "arrivalTime": "2025-10-15T16:00:00Z",
    "price": 200,
    "type": "EXPRESS",
    "busId": "uuid-of-bus"
  }'
```

### Searching for Routes
```bash
# Find routes from Istanbul to Ankara tomorrow
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15"
```

### Getting Popular Routes
```bash
# Get top 5 most booked routes
curl "http://localhost:3000/routes/popular?limit=5"
```
