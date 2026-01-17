# Bus Module Summary

## Updated Structure

The Bus module has been updated with a simplified and more flexible structure:

### Core Bus Fields
- **id** - UUID (auto-generated)
- **plate** - Unique license plate number
- **model** - Bus model name
- **seatCount** - Total number of seats
- **layoutType** - Seat configuration (LAYOUT_2_1, LAYOUT_2_2, LAYOUT_1_2)
- **busPhone** - Contact phone number for the bus (optional)
- **taxOffice** - Tax office name (optional)
- **taxNumber** - Tax identification number (optional)
- **owner** - Name of the bus owner (optional)
- **specs** - Relation to BusSpecs (detailed specifications)

### BusSpecs (Separate Table)
Detailed specifications stored in a separate table with one-to-one relationship:

- **id** - UUID
- **busId** - Reference to Bus (unique, cascade delete)
- **brand** - Manufacturer brand (optional)
- **year** - Manufacturing year (optional)
- **engineType** - Engine specifications (optional)
- **fuelType** - Fuel type (optional)
- **hasAC** - Air conditioning (default: true)
- **hasWifi** - WiFi availability (default: false)
- **hasToilet** - Toilet availability (default: false)
- **hasTV** - TV/Entertainment (default: false)
- **features** - String array for additional features
- **createdAt** - Timestamp
- **updatedAt** - Timestamp

## Key Changes

### Removed Fields
- ✗ `brand` (moved to BusSpecs)
- ✗ `isActive` (removed entirely)
- ✗ `createdAt` (removed from Bus, kept in BusSpecs)
- ✗ `updatedAt` (removed from Bus, kept in BusSpecs)

### New Features
- ✓ Separate BusSpecs table for detailed specifications
- ✓ Flexible features array
- ✓ Optional specification fields
- ✓ Cascade delete (deleting bus removes specs)
- ✓ Brand filtering through specs relation

## API Endpoints

### Create Bus
```http
POST /buses
Authorization: Bearer {token}
Content-Type: application/json

{
  "plate": "34ABC123",
  "model": "Travego 17 SHD",
  "seatCount": 48,
  "layoutType": "LAYOUT_2_1",
  "busPhone": "+90 555 123 4567",
  "specs": {
    "brand": "Mercedes-Benz",
    "year": 2023,
    "engineType": "Euro 6",
    "fuelType": "Diesel",
    "hasAC": true,
    "hasWifi": true,
    "hasToilet": true,
    "hasTV": true,
    "features": ["Leather seats", "USB charging", "Reading lights"]
  }
}
```

### Get All Buses
```http
GET /buses
GET /buses?brand=Mercedes
GET /buses?layoutType=LAYOUT_2_1
```

### Get Single Bus
```http
GET /buses/{id}
GET /buses/plate/{plate}
```

### Update Bus
```http
PATCH /buses/{id}
Authorization: Bearer {token}

{
  "model": "Updated Model",
  "seatCount": 50,
  "specs": {
    "year": 2024,
    "hasWifi": true
  }
}
```

### Delete Bus
```http
DELETE /buses/{id}
Authorization: Bearer {token}
```

### Get Statistics
```http
GET /buses/stats
Authorization: Bearer {token}

Response:
{
  "total": 10,
  "byLayout": {
    "LAYOUT_2_1": 5,
    "LAYOUT_2_2": 3,
    "LAYOUT_1_2": 2
  }
}
```

## Database Migration

After updating the schema, run:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migration
npm run prisma:migrate

# Migration will:
# 1. Remove brand, isActive, createdAt, updatedAt from buses table
# 2. Create new bus_specs table
# 3. Set up one-to-one relationship with cascade delete
```

## Benefits of New Structure

1. **Separation of Concerns** - Basic bus info vs detailed specifications
2. **Flexibility** - Specs are optional, can be added/updated separately
3. **Extensibility** - Easy to add new specification fields without changing core bus model
4. **Clean API** - Simpler bus object with optional nested specs
5. **Better Queries** - Can query buses with or without specs
6. **Features Array** - Dynamic feature list without schema changes

## Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "plate": "34ABC123",
  "model": "Travego 17 SHD",
  "seatCount": 48,
  "layoutType": "LAYOUT_2_1",
  "busPhone": "+90 555 123 4567",
  "specs": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "busId": "550e8400-e29b-41d4-a716-446655440000",
    "brand": "Mercedes-Benz",
    "year": 2023,
    "engineType": "Euro 6",
    "fuelType": "Diesel",
    "hasAC": true,
    "hasWifi": true,
    "hasToilet": true,
    "hasTV": true,
    "features": ["Leather seats", "USB charging", "Reading lights"],
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-14T10:00:00.000Z"
  }
}
```

## Layout Types

- **LAYOUT_2_1** - 2+1 seating (luxury buses, wider seats)
- **LAYOUT_2_2** - 2+2 seating (standard buses, more capacity)
- **LAYOUT_1_2** - 1+2 seating (VIP buses, maximum comfort)

## Validation Rules

- `plate` - Required, unique, string
- `model` - Required, string
- `seatCount` - Required, integer, minimum 1
- `layoutType` - Required, enum (LAYOUT_2_1, LAYOUT_2_2, LAYOUT_1_2)
- `busPhone` - Optional, string
- `specs.brand` - Optional, string
- `specs.year` - Optional, integer, minimum 1900
- `specs.engineType` - Optional, string
- `specs.fuelType` - Optional, string
- `specs.hasAC` - Optional, boolean
- `specs.hasWifi` - Optional, boolean
- `specs.hasToilet` - Optional, boolean
- `specs.hasTV` - Optional, boolean
- `specs.features` - Optional, array of strings
