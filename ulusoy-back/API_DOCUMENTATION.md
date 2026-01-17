# Bus Ticketing Backend

A full-featured backend for a bus ticketing and management platform built with NestJS, TypeScript, Prisma ORM, and PostgreSQL.

## Features

- **Bus Management**: CRUD operations for managing buses with specifications, seat layouts, and capacity
- **Route Management**: Create and manage bus routes with departure, destination, stations, pricing
- **Ticket System**: Reservation, purchase, cancellation, and PNR-based status checks
- **Authentication**: JWT-based login and registration system
- **User Roles**: Admin, Customer, and Agent role-based access control
- **Real-time Updates**: WebSocket support for seat availability
- **Payment Integration**: Ready for iyzico or Stripe integration
- **Admin Panel APIs**: Dashboard and sales statistics endpoints

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and JWT secret

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

## Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile (protected)

### Bus Management
- `POST /buses` - Create a new bus (Admin only)
- `GET /buses` - Get all buses (supports filtering)
- `GET /buses/:id` - Get bus by ID
- `GET /buses/plate/:plate` - Get bus by plate number
- `PATCH /buses/:id` - Update bus (Admin only)
- `DELETE /buses/:id` - Delete bus (Admin only)
- `GET /buses/stats` - Get bus statistics (Admin/Agent only)

### Route Management
- `POST /routes` - Create a new route (Admin/Agent)
- `GET /routes` - Get all routes
- `GET /routes/stations` - Get all unique stations in specific JSON format
- `GET /routes/search` - Search routes with filters
- `GET /routes/:id` - Get route by ID

### Query Parameters for GET /buses
- `brand` - Filter by brand name (searches in specs)
- `layoutType` - Filter by layout type (LAYOUT_2_1, LAYOUT_2_2, LAYOUT_1_2)

## Bus Fields

- `id` - Unique identifier (UUID)
- `plate` - License plate number (unique)
- `model` - Bus model
- `seatCount` - Total number of seats
- `layoutType` - Seat layout configuration (LAYOUT_2_1, LAYOUT_2_2, LAYOUT_1_2)
- `busPhone` - Contact phone number (optional)
- `taxOffice` - Tax office name (optional)
- `taxNumber` - Tax identification number (optional)
- `owner` - Name of the bus owner (optional)
- `specs` - Bus specifications (BusSpecs object)

## Bus Specifications (BusSpecs)

- `id` - Unique identifier (UUID)
- `busId` - Reference to parent bus
- `brand` - Bus brand/manufacturer (optional)
- `year` - Manufacturing year (optional)
- `engineType` - Engine type/specification (optional)
- `fuelType` - Fuel type (optional)
- `hasAC` - Air conditioning available (default: true)
- `hasWifi` - WiFi available (default: false)
- `hasToilet` - Toilet available (default: false)
- `hasTV` - TV/Entertainment system available (default: false)
- `features` - Array of additional features (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Layout Types

- `LAYOUT_2_1` - 2+1 seating configuration
- `LAYOUT_2_2` - 2+2 seating configuration
- `LAYOUT_1_2` - 1+2 seating configuration

## User Roles

- `ADMIN` - Full access to all operations
- `CUSTOMER` - Can book tickets and view routes
- `AGENT` - Can manage bookings and view statistics

## Database Schema

The application uses Prisma ORM with the following main models:
- User
- Bus
- Route
- Ticket

See `prisma/schema.prisma` for complete schema definition.

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio
```

## Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication module
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   └── bus/           # Bus management module
│       ├── dto/
│       ├── bus.controller.ts
│       ├── bus.service.ts
│       └── bus.module.ts
├── prisma/            # Prisma service and module
├── app.module.ts
└── main.ts
```

## License

MIT
