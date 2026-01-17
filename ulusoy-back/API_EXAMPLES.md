# Bus Management API Examples

## Authentication

### Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Bus Management (Protected Routes)

Save the token from login response and use it in subsequent requests:
```bash
export TOKEN="your-jwt-token-here"
```

### Create a Bus
```bash
curl -X POST http://localhost:3000/buses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
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
  }'
```

Response:
```json
{
  "id": "uuid",
  "plate": "34ABC123",
  "model": "Travego 17 SHD",
  "seatCount": 48,
  "layoutType": "LAYOUT_2_1",
  "busPhone": "+90 555 123 4567",
  "specs": {
    "id": "uuid",
    "busId": "uuid",
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

### Get All Buses
```bash
curl -X GET http://localhost:3000/buses
```

### Filter Buses by Brand
```bash
curl -X GET http://localhost:3000/buses?brand=Mercedes
```

### Filter by Layout Type
```bash
curl -X GET http://localhost:3000/buses?layoutType=LAYOUT_2_1
```

### Get Bus by ID
```bash
curl -X GET http://localhost:3000/buses/{bus-id}
```

### Get Bus by Plate
```bash
curl -X GET http://localhost:3000/buses/plate/34ABC123
```

### Update a Bus
```bash
curl -X PATCH http://localhost:3000/buses/{bus-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "model": "Travego 16 RHD",
    "seatCount": 50,
    "specs": {
      "year": 2024,
      "hasWifi": true
    }
  }'
```

### Delete a Bus
```bash
curl -X DELETE http://localhost:3000/buses/{bus-id} \
  -H "Authorization: Bearer $TOKEN"
```

### Get Bus Statistics (Admin/Agent only)
```bash
curl -X GET http://localhost:3000/buses/stats \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "total": 10,
  "byLayout": {
    "LAYOUT_2_1": 5,
    "LAYOUT_2_2": 3,
    "LAYOUT_1_2": 2
  }
}
```

## Example Bus Data

### 2+1 Layout Bus (Luxury)
```json
{
  "plate": "34LUX001",
  "model": "Travego 17 SHD",
  "seatCount": 45,
  "layoutType": "LAYOUT_2_1",
  "specs": {
    "brand": "Mercedes-Benz",
    "year": 2023,
    "engineType": "Euro 6",
    "fuelType": "Diesel",
    "hasAC": true,
    "hasWifi": true,
    "hasToilet": true,
    "hasTV": true,
    "features": ["Leather seats", "Panoramic windows", "USB charging"]
  }
}
```

### 2+2 Layout Bus (Standard)
```json
{
  "plate": "06STD001",
  "model": "Lion's Coach",
  "seatCount": 52,
  "layoutType": "LAYOUT_2_2",
  "specs": {
    "brand": "MAN",
    "year": 2022,
    "engineType": "Euro 5",
    "fuelType": "Diesel",
    "hasAC": true,
    "hasWifi": false,
    "hasToilet": false,
    "hasTV": true,
    "features": ["Reclining seats", "Overhead storage"]
  }
}
```

### 1+2 Layout Bus (VIP)
```json
{
  "plate": "34VIP001",
  "model": "S 531 DT",
  "seatCount": 36,
  "layoutType": "LAYOUT_1_2",
  "specs": {
    "brand": "Setra",
    "year": 2024,
    "engineType": "Euro 6",
    "fuelType": "Diesel",
    "hasAC": true,
    "hasWifi": true,
    "hasToilet": true,
    "hasTV": true,
    "features": ["Premium leather seats", "Entertainment system", "Personal screens", "USB + Power outlets"]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "seatCount must not be less than 1",
    "layoutType must be one of the following values: LAYOUT_2_1, LAYOUT_2_2, LAYOUT_1_2"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: ADMIN",
  "error": "Forbidden"
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
  "message": "Bus with plate 34ABC123 already exists",
  "error": "Conflict"
}
```

## Testing with Postman

1. Import the following as environment variables:
   - `base_url`: http://localhost:3000
   - `token`: (will be set after login)

2. Create a POST request to `{{base_url}}/auth/login` and save the token

3. Use `{{token}}` in Authorization header as `Bearer {{token}}`

## Notes

- All timestamps are in ISO 8601 format
- UUIDs are automatically generated for IDs
- Plate numbers must be unique
- Admin role required for create, update, delete operations
- Buses with active routes cannot be deleted (must deactivate routes first)
