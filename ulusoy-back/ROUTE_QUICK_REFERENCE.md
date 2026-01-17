# Route Module - Quick Reference

## Quick Start

### Create a Route
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
    "type": "EXPRESS",
    "busId": "your-bus-id"
  }'
```

### Search Routes
```bash
curl "http://localhost:3000/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15"
```

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| fromCity | String | Yes | Departure city |
| toCity | String | Yes | Destination city |
| stations | String[] | No | Intermediate stops |
| departureTime | DateTime | Yes | Departure time |
| arrivalTime | DateTime | Yes | Arrival time (must be after departure) |
| price | Number | Yes | Route price (min: 0) |
| type | Enum | No | STANDARD, EXPRESS, VIP, LUXURY (default: STANDARD) |
| busId | UUID | Yes | Reference to bus |
| isActive | Boolean | No | Active status (default: true) |

## Endpoint Cheat Sheet

```
POST   /routes                 Create route (Admin/Agent)
GET    /routes                 List all routes
GET    /routes/search          Search routes
GET    /routes/:id             Get route by ID
GET    /routes/upcoming        Get upcoming routes
GET    /routes/popular         Get popular routes
GET    /routes/stats           Get statistics (Admin/Agent)
PATCH  /routes/:id             Update route (Admin/Agent)
DELETE /routes/:id             Delete route (Admin)
```

## Search Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| fromCity | String | Departure city (partial) | `fromCity=Istanbul` |
| toCity | String | Destination city (partial) | `toCity=Ankara` |
| date | String | Departure date (ISO) | `date=2025-10-15` |
| type | Enum | Route type | `type=EXPRESS` |
| minPrice | Number | Minimum price | `minPrice=100` |
| maxPrice | Number | Maximum price | `maxPrice=200` |
| busId | UUID | Specific bus | `busId=uuid` |
| isActive | String | Active status | `isActive=true` |
| page | Number | Page number | `page=1` |
| limit | Number | Results per page (max 100) | `limit=20` |

## Route Types

```
STANDARD → Regular service with standard amenities
EXPRESS  → Faster service with fewer stops
VIP      → Premium service with luxury amenities
LUXURY   → Top-tier service with maximum comfort
```

## Common Searches

```bash
# Find routes from city A to city B
/routes/search?fromCity=Istanbul&toCity=Ankara

# Find routes on specific date
/routes/search?date=2025-10-15

# Find routes with price range
/routes/search?minPrice=100&maxPrice=200

# Find EXPRESS routes only
/routes/search?type=EXPRESS

# Combined search
/routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15&type=VIP

# Next week's routes
/routes/upcoming?days=7

# Top 10 popular routes
/routes/popular?limit=10
```

## Validation Rules

✅ **Required Fields:** fromCity, toCity, departureTime, arrivalTime, price, busId
✅ **Time Rule:** arrivalTime must be after departureTime
✅ **Price Rule:** Must be >= 0
✅ **Bus Rule:** Bus must exist and not be double-booked
✅ **UUID Format:** busId must be valid UUID

## Response Enhancements

Search results include:
- `availableSeats` - Calculated from bus capacity minus tickets
- `duration` - Formatted as "Xh Ym"
- `_count.tickets` - Number of bookings
- Full `bus` object with specs

## Access Control

| Role | Create | Read | Update | Delete | Stats |
|------|--------|------|--------|--------|-------|
| Public | ❌ | ✅ | ❌ | ❌ | ❌ |
| Customer | ❌ | ✅ | ❌ | ❌ | ❌ |
| Agent | ✅ | ✅ | ✅ | ❌ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

## Error Codes

| Code | Error | Cause |
|------|-------|-------|
| 400 | Bad Request | Invalid times, validation failed |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Route or bus not found |
| 409 | Conflict | Bus time conflict, delete protection |

## Database Indexes

```sql
-- Optimized for city pair searches
CREATE INDEX idx_routes_cities ON routes(fromCity, toCity);

-- Optimized for date queries
CREATE INDEX idx_routes_departure ON routes(departureTime);
```

## Example Workflow

### Customer Booking
```
1. Search: GET /routes/search?fromCity=Istanbul&toCity=Ankara&date=2025-10-15
2. View: GET /routes/{selected-route-id}
3. Check: availableSeats > 0
4. Book: POST /tickets (next module)
```

### Admin Creating Route
```
1. Check bus: GET /buses/{bus-id}
2. Create: POST /routes
3. Verify: GET /routes/{new-route-id}
4. Monitor: GET /routes/stats
```

## Pro Tips

💡 **Use pagination** for better performance  
💡 **Search by date** for customer-friendly results  
💡 **Check availableSeats** before allowing bookings  
💡 **Use upcoming endpoint** for homepage displays  
💡 **Monitor popular routes** for capacity planning  
💡 **Deactivate instead of delete** to preserve history  
💡 **Use route types** to differentiate service levels  
💡 **Add buffer time** between routes for same bus  

## Integration with Other Modules

```
Route ←→ Bus
- Validates bus exists
- Checks bus availability
- Includes bus specs in response

Route ←→ Ticket (Future)
- Counts tickets for availability
- Prevents deletion with tickets
- Lists booked seats

Route ←→ Auth
- JWT for protected endpoints
- Role-based permissions
```

## Quick Debug

```bash
# Check if module loaded
curl http://localhost:3000/routes

# Test search endpoint
curl "http://localhost:3000/routes/search?fromCity=test"

# Verify authentication
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/routes/stats

# Check database
npm run prisma:studio
```

## Sample Data

```json
{
  "fromCity": "Istanbul",
  "toCity": "Ankara",
  "stations": ["Izmit", "Bolu"],
  "departureTime": "2025-10-15T08:00:00Z",
  "arrivalTime": "2025-10-15T14:00:00Z",
  "price": 150,
  "type": "EXPRESS",
  "busId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Documentation Links

📖 [Full Documentation](ROUTE_MODULE_DOCUMENTATION.md)  
📋 [API Examples](ROUTE_API_EXAMPLES.md)  
📝 [Complete Summary](ROUTE_MODULE_SUMMARY.md)  
🏠 [Main README](README.md)
