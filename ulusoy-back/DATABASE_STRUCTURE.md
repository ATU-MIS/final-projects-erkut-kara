# Database Structure

## Entity Relationship Diagram

```
┌─────────────────────────────────────────┐
│              Bus                        │
├─────────────────────────────────────────┤
│ id              UUID (PK)               │
│ plate           String (Unique)         │
│ model           String                  │
│ seatCount       Int                     │
│ layoutType      LayoutType              │
└─────────────────────────────────────────┘
       │
       │ 1:1
       │
       ▼
┌─────────────────────────────────────────┐
│           BusSpecs                      │
├─────────────────────────────────────────┤
│ id              UUID (PK)               │
│ busId           UUID (FK, Unique)       │
│ brand           String?                 │
│ year            Int?                    │
│ engineType      String?                 │
│ fuelType        String?                 │
│ hasAC           Boolean (default: true) │
│ hasWifi         Boolean (default: false)│
│ hasToilet       Boolean (default: false)│
│ hasTV           Boolean (default: false)│
│ features        String[]                │
│ createdAt       DateTime                │
│ updatedAt       DateTime                │
└─────────────────────────────────────────┘
```

## Table: buses

| Column      | Type       | Constraints    | Description                      |
|-------------|------------|----------------|----------------------------------|
| id          | UUID       | PRIMARY KEY    | Unique bus identifier            |
| plate       | String     | UNIQUE         | License plate number             |
| model       | String     |                | Bus model name                   |
| seatCount   | Int        |                | Total number of seats            |
| layoutType  | Enum       |                | LAYOUT_2_1, LAYOUT_2_2           |
| busPhone    | String     | NULLABLE       | Contact phone for the bus        |
| taxOffice   | String     | NULLABLE       | Tax office name                  |
| taxNumber   | String     | NULLABLE       | Tax identification number        |
| owner       | String     | NULLABLE       | Name of the bus owner            |

## Table: bus_specs

| Column      | Type       | Constraints           | Description                      |
|-------------|------------|-----------------------|----------------------------------|
| id          | UUID       | PRIMARY KEY           | Unique spec identifier           |
| busId       | UUID       | FOREIGN KEY, UNIQUE   | Reference to bus (cascade)       |
| brand       | String     | NULLABLE              | Manufacturer brand               |
| year        | Int        | NULLABLE              | Manufacturing year               |
| engineType  | String     | NULLABLE              | Engine specification             |
| fuelType    | String     | NULLABLE              | Fuel type                        |
| hasAC       | Boolean    | DEFAULT true          | Air conditioning                 |
| hasWifi     | Boolean    | DEFAULT false         | WiFi availability                |
| hasToilet   | Boolean    | DEFAULT false         | Toilet availability              |
| hasTV       | Boolean    | DEFAULT false         | TV/Entertainment                 |
| features    | String[]   |                       | Additional features              |
| createdAt   | DateTime   | AUTO                  | Creation timestamp               |
| updatedAt   | DateTime   | AUTO                  | Update timestamp                 |

## Table: routes

| Column         | Type       | Constraints    | Description                      |
|----------------|------------|----------------|----------------------------------|
| id             | UUID       | PRIMARY KEY    | Unique route identifier          |
| fromCity       | String     |                | Departure city                   |
| toCity         | String     |                | Destination city                 |
| stations       | String[]   |                | Intermediate stops               |
| departureTime  | DateTime   | INDEX          | Departure timestamp              |
| arrivalTime    | DateTime   |                | Arrival timestamp                |
| price          | Float      |                | Base Price (Full Route)          |
| type           | Enum       | DEFAULT STAND  | RouteType (STANDARD, VIP...)     |
| busId          | UUID       | FOREIGN KEY    | Reference to bus                 |
| captainName    | String     | NULLABLE       | Captain/Head Driver Name         |
| firstDriverName| String     | NULLABLE       | 1st Driver Name                  |
| secondDriverName| String    | NULLABLE       | 2nd Driver Name                  |
| assistantName  | String     | NULLABLE       | Assistant (Muavin) Name          |
| restStops      | String[]   |                | List of facilities/stops         |
| isActive       | Boolean    | DEFAULT true   | Is route active?                 |
| createdAt      | DateTime   | AUTO           | Creation timestamp               |
| updatedAt      | DateTime   | AUTO           | Update timestamp                 |

## Table: route_prices (New)

| Column    | Type    | Constraints         | Description                      |
|-----------|---------|---------------------|----------------------------------|
| id        | UUID    | PRIMARY KEY         | Unique identifier                |
| routeId   | UUID    | FK, UNIQUE Comp.    | Reference to route               |
| fromCity  | String  | UNIQUE Comp.        | Segment Start City               |
| toCity    | String  | UNIQUE Comp.        | Segment End City                 |
| price     | Float   |                     | Price for this segment           |
| isSold    | Boolean | DEFAULT true        | Is segment open for sale?        |

## Table: tickets

| Column          | Type       | Constraints          | Description                      |
|-----------------|------------|----------------------|----------------------------------|
| id              | UUID       | PRIMARY KEY          | Unique ticket identifier         |
| pnrNumber       | String     | UNIQUE, INDEX        | 6-char unique PNR code           |
| routeId         | UUID       | FOREIGN KEY, INDEX   | Reference to route               |
| userId          | UUID       | FOREIGN KEY, INDEX   | Reference to user (Ticket Owner)|
| issuedById      | UUID       | FOREIGN KEY          | User who performed action (Agent)|
| fromCity        | String     |                      | Departure city                   |
| toCity          | String     |                      | Destination city                 |
| fromStopIndex   | Int        |                      | Index of departure stop          |
| toStopIndex     | Int        |                      | Index of arrival stop            |
| seatNumber      | Int        |                      | Seat number                      |
| gender          | Enum       |                      | Gender (MALE, FEMALE)            |
| price           | Float      |                      | Ticket price                     |
| tcKimlikNo      | String     | NULLABLE             | Turkish ID Number                |
| userPhoneNumber | String     |                      | Contact phone                    |
| passengerName   | String     |                      | Passenger name                   |
| status          | Enum       | DEFAULT RESERVED     | TicketStatus                     |
| paymentStatus   | Enum       | DEFAULT PENDING      | PaymentStatus                    |
| suspendedAt     | DateTime   | NULLABLE             | Suspension timestamp             |
| cancelledAt     | DateTime   | NULLABLE             | Cancellation timestamp           |
| createdAt       | DateTime   | AUTO                 | Creation timestamp               |
| updatedAt       | DateTime   | AUTO                 | Update timestamp                 |

## Table: payments

| Column        | Type       | Constraints          | Description                      |
|---------------|------------|----------------------|----------------------------------|
| id            | UUID       | PRIMARY KEY          | Unique payment identifier        |
| ticketId      | UUID       | FOREIGN KEY, UNIQUE  | Reference to ticket              |
| transactionId | String     | UNIQUE               | Provider transaction ID          |
| amount        | Float      |                      | Payment amount                   |
| currency      | String     | DEFAULT "TRY"        | Currency code                    |
| provider      | String     |                      | "IYZICO", "MOCK", etc.           |
| status        | Enum       | DEFAULT PENDING      | PaymentStatus                    |
| rawResponse   | String     | NULLABLE             | Full JSON response from provider |
| createdAt     | DateTime   | AUTO                 | Creation timestamp               |
| updatedAt     | DateTime   | AUTO                 | Update timestamp                 |

## Relationships

### Bus → BusSpecs (One-to-One)
- One bus can have zero or one set of specifications
- When a bus is deleted, its specifications are automatically deleted (CASCADE)
- BusId in bus_specs is unique, ensuring one-to-one relationship

### Bus → Routes (One-to-Many)
- One bus can have multiple routes
- Each route belongs to one bus

### Route → Tickets (One-to-Many)
- One route can have multiple tickets
- Each ticket belongs to one route

### User → Tickets (One-to-Many)
- One user can have multiple tickets
- Each ticket belongs to one user

### Ticket → Payment (One-to-One)
- One ticket can have at most one payment record

## Enums

### LayoutType
- `LAYOUT_2_1` - 2+1 seating configuration (luxury)
- `LAYOUT_2_2` - 2+2 seating configuration (standard)

## Indexes

Automatically created by Prisma:
- Primary key index on `id` (both tables)
- Unique index on `plate` (buses table)
- Unique index on `busId` (bus_specs table)
- Foreign key index on `busId` (bus_specs table)

## Example Queries

### Create Bus with Specs
```sql
-- Creates both bus and specs in a transaction
INSERT INTO buses (id, plate, model, seatCount, layoutType)
VALUES ('uuid1', '34ABC123', 'Travego', 48, 'LAYOUT_2_1');

INSERT INTO bus_specs (id, busId, brand, year, hasAC, hasWifi)
VALUES ('uuid2', 'uuid1', 'Mercedes-Benz', 2023, true, true);
```

### Get Bus with Specs
```sql
SELECT b.*, s.*
FROM buses b
LEFT JOIN bus_specs s ON b.id = s.busId
WHERE b.id = 'uuid1';
```

### Filter by Brand (through specs)
```sql
SELECT b.*
FROM buses b
INNER JOIN bus_specs s ON b.id = s.busId
WHERE s.brand ILIKE '%Mercedes%';
```

### Delete Bus (cascades to specs)
```sql
DELETE FROM buses WHERE id = 'uuid1';
-- bus_specs record is automatically deleted
```

## Migration Notes

When migrating from old schema to new schema:

1. **Data Migration** - Move brand from buses to bus_specs
2. **Remove Columns** - Drop isActive, createdAt, updatedAt from buses
3. **Create Table** - Create bus_specs table
4. **Migrate Data** - Transfer existing bus data to new structure
5. **Add Constraints** - Set up foreign key and unique constraints

```sql
-- Example migration
CREATE TABLE bus_specs (
  id UUID PRIMARY KEY,
  busId UUID UNIQUE NOT NULL,
  brand VARCHAR(255),
  year INT,
  -- ... other fields
  FOREIGN KEY (busId) REFERENCES buses(id) ON DELETE CASCADE
);

-- Migrate existing data
INSERT INTO bus_specs (id, busId, brand)
SELECT gen_random_uuid(), id, brand
FROM buses;

-- Remove old columns
ALTER TABLE buses DROP COLUMN brand;
ALTER TABLE buses DROP COLUMN isActive;
ALTER TABLE buses DROP COLUMN createdAt;
ALTER TABLE buses DROP COLUMN updatedAt;
```
