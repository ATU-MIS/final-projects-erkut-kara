# Route Module - API Examples

## Table of Contents
- [Create Routes](#create-routes)
- [List Routes](#list-routes)
- [Search Routes](#search-routes)
- [Get Route Details](#get-route-details)
- [Update Routes](#update-routes)
- [Delete Routes](#delete-routes)
- [Special Endpoints](#special-endpoints)

---

## Create Routes

### Create Standard Route
```bash
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "stations": ["Izmit", "Bolu"],
    "departureTime": "2025-10-15T08:00:00Z",
    "arrivalTime": "2025-10-15T14:00:00Z",
    "price": 150,
    "type": "STANDARD",
    "busId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Create Express Route (No Intermediate Stations)
```bash
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Istanbul",
    "toCity": "Izmir",
    "stations": [],
    "departureTime": "2025-10-16T10:00:00Z",
    "arrivalTime": "2025-10-16T18:00:00Z",
    "price": 250,
    "type": "EXPRESS",
    "busId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### Create VIP Route
```bash
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Ankara",
    "toCity": "Antalya",
    "stations": ["Konya"],
    "departureTime": "2025-10-17T09:00:00Z",
    "arrivalTime": "2025-10-17T17:00:00Z",
    "price": 300,
    "type": "VIP",
    "busId": "770e8400-e29b-41d4-a716-446655440002"
  }'
```

### Create Luxury Night Route
```bash
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Istanbul",
    "toCity": "Trabzon",
    "stations": ["Ankara", "Samsun"],
    "departureTime": "2025-10-18T20:00:00Z",
    "arrivalTime": "2025-10-19T08:00:00Z",
    "price": 400,
    "type": "LUXURY",
    "busId": "880e8400-e29b-41d4-a716-446655440003"
  }'
```

---

## List Routes

### Get All Active Routes
```bash
curl http://localhost:3000/routes?isActive=true
```

### Get Routes by Type
```bash
# EXPRESS routes only
curl http://localhost:3000/routes?type=EXPRESS

# VIP routes only
curl http://localhost:3000/routes?type=VIP
```

### Paginated Results
```bash
# First page, 10 results
curl http://localhost:3000/routes?page=1&limit=10

# Second page, 20 results
curl http://localhost:3000/routes?page=2&limit=20
```

### Get All Routes (Including Inactive)
```bash
curl http://localhost:3000/routes
```

---

## Search Routes

### Search by Cities
```bash
# Exact city names
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara"

# Partial match (case-insensitive)
curl "http://localhost:3000/routes/search?fromCity=istan&toCity=anka"
```

### Search by Date
```bash
# Routes departing on October 15, 2025
curl "http://localhost:3000/routes/search?date=2025-10-15"

# Combine with cities
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15"
```

### Search by Price Range
```bash
# Routes between 100 and 200
curl "http://localhost:3000/routes/search?minPrice=100&maxPrice=200"

# Routes cheaper than 150
curl "http://localhost:3000/routes/search?maxPrice=150"

# Routes more expensive than 200
curl "http://localhost:3000/routes/search?minPrice=200"
```

### Search by Route Type
```bash
# Only EXPRESS routes from Istanbul to Ankara
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&type=EXPRESS"
```

### Search by Specific Bus
```bash
curl "http://localhost:3000/routes/search?busId=550e8400-e29b-41d4-a716-446655440000"
```

### Combined Search
```bash
# Find affordable EXPRESS routes from Istanbul to Ankara tomorrow
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15&type=EXPRESS&maxPrice=200&page=1&limit=10"
```

### Search Including Inactive Routes (Admin)
```bash
curl "http://localhost:3000/routes/search?fromCity=Istanbul&isActive=false" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Get Route Details

### Get Single Route with Full Details
```bash
curl http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000
```

**Response includes:**
- Full route details
- Bus information with specs
- List of booked tickets (seat numbers and status)

---

## Update Routes

### Update Price
```bash
curl -X PATCH http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 175
  }'
```

### Update Departure/Arrival Times
```bash
curl -X PATCH http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "departureTime": "2025-10-15T09:00:00Z",
    "arrivalTime": "2025-10-15T15:00:00Z"
  }'
```

### Change Bus Assignment
```bash
curl -X PATCH http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "busId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### Add Intermediate Stations
```bash
curl -X PATCH http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stations": ["Izmit", "Bolu", "Gerede"]
  }'
```

### Deactivate Route
```bash
curl -X PATCH http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### Update Multiple Fields
```bash
curl -X PATCH http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 200,
    "type": "EXPRESS",
    "stations": ["Izmit"]
  }'
```

---

## Delete Routes

### Delete Route (Admin Only)
```bash
curl -X DELETE http://localhost:3000/routes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

**Note:** Cannot delete routes with tickets. Will return 409 Conflict error.

---

## Special Endpoints

### Get Upcoming Routes (Next 7 Days)
```bash
# All upcoming routes
curl http://localhost:3000/routes/upcoming

# Upcoming routes from specific city
curl "http://localhost:3000/routes/upcoming?fromCity=Istanbul"

# Upcoming routes between cities
curl "http://localhost:3000/routes/upcoming?fromCity=Istanbul&toCity=Ankara"

# Upcoming routes for next 14 days
curl "http://localhost:3000/routes/upcoming?days=14"
```

### Get Popular Routes
```bash
# Top 10 most booked routes
curl http://localhost:3000/routes/popular

# Top 5 most booked routes
curl "http://localhost:3000/routes/popular?limit=5"
```

### Get Route Statistics (Admin/Agent)
```bash
curl http://localhost:3000/routes/stats \
  -H "Authorization: Bearer $TOKEN"
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

---

## Example Response Structures

### Search Result with Available Seats
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fromCity": "Istanbul",
      "toCity": "Ankara",
      "stations": ["Izmit", "Bolu"],
      "departureTime": "2025-10-15T08:00:00.000Z",
      "arrivalTime": "2025-10-15T14:00:00.000Z",
      "price": 150,
      "type": "EXPRESS",
      "busId": "bus-uuid",
      "isActive": true,
      "availableSeats": 33,
      "duration": "6h 0m",
      "bus": {
        "id": "bus-uuid",
        "plate": "34ABC123",
        "model": "Travego 17 SHD",
        "seatCount": 48,
        "layoutType": "LAYOUT_2_1",
        "specs": {
          "brand": "Mercedes-Benz",
          "year": 2023,
          "hasAC": true,
          "hasWifi": true,
          "hasToilet": true,
          "hasTV": true
        }
      },
      "_count": {
        "tickets": 15
      }
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

### Route Detail with Tickets
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "stations": ["Izmit", "Bolu"],
  "departureTime": "2025-10-15T08:00:00.000Z",
  "arrivalTime": "2025-10-15T14:00:00.000Z",
  "price": 150,
  "type": "EXPRESS",
  "busId": "bus-uuid",
  "isActive": true,
  "createdAt": "2025-10-14T10:00:00.000Z",
  "updatedAt": "2025-10-14T10:00:00.000Z",
  "bus": { ... },
  "tickets": [
    {
      "id": "ticket-uuid-1",
      "seatNumber": 1,
      "status": "CONFIRMED"
    },
    {
      "id": "ticket-uuid-2",
      "seatNumber": 5,
      "status": "CONFIRMED"
    }
  ]
}
```

---

## Error Examples

### Invalid Time Range
```bash
# Arrival before departure
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Istanbul",
    "toCity": "Ankara",
    "departureTime": "2025-10-15T14:00:00Z",
    "arrivalTime": "2025-10-15T08:00:00Z",
    "price": 150,
    "busId": "bus-uuid"
  }'

# Response: 400 Bad Request
# "Arrival time must be after departure time"
```

### Bus Already Assigned
```bash
# Try to assign bus that's already on another route at same time
# Response: 409 Conflict
# "Bus is already assigned to another route during this time period"
```

### Cannot Delete Route with Tickets
```bash
# Try to delete route that has tickets
# Response: 409 Conflict
# "Cannot delete route with 15 ticket(s). Cancel or refund tickets first."
```

---

## Integration Examples

### Customer Booking Flow
```bash
# 1. Search for routes
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15"

# 2. Get route details to see seat layout
curl http://localhost:3000/routes/{route-id}

# 3. Create ticket (next step in ticket module)
```

### Admin Daily Operations
```bash
# 1. Check today's stats
curl http://localhost:3000/routes/stats -H "Authorization: Bearer $TOKEN"

# 2. View upcoming routes
curl "http://localhost:3000/routes/upcoming?days=1"

# 3. Create new route
curl -X POST http://localhost:3000/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```
