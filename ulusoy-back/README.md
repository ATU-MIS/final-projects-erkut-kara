# Bus Ticketing Platform - Backend API

This project is a full backend for a bus ticketing and management platform, inspired by https://www.aliosmanulusoy.com

Example Ticket Layout: https://www.aliosmanulusoy.com/list/samsun/kayseri

Always write modular NestJS code, using services for business logic and controllers for routes. Use Prisma schema for database models. Do not use in-memory arrays — use actual Prisma entities.

## Features

✅ **Bus Management** - Manage buses with detailed specifications (plate, model, seat layout, capacity, and detailed specs)

✅ **Route Management** - Create routes with bus assignment, departure, stations, destination, date, time, and pricing

✅ **Ticket System** - Reservation, purchase, cancellation, and status check with PNR number

✅ **Authentication** - Login and register system with email/password

✅ **Real-time Updates** - WebSocket support for real-time seat availability updates

✅ **Payment Integration** - iyzico payment gateway integration with mock fallback

📊 **Admin Panel APIs** - Dashboard, sales statistics, and management endpoints

👥 **User Roles** - Admin, customer, and agent role-based access control

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer

## Project Structure

Each module follows clean architecture pattern: `src/modules/{module}/`

```
src/
├── modules/
│   ├── auth/           # Authentication & authorization
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── ...
│   └── bus/            # Bus management
│       ├── dto/
│       └── ...
├── prisma/             # Prisma service & module
├── app.module.ts
└── main.ts
```

## Quick Start

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

## Documentation

- 📖 [Installation Guide](INSTALLATION.md) - Complete setup instructions
- 📚 [API Documentation](API_DOCUMENTATION.md) - Full API reference
- 💡 [API Examples](API_EXAMPLES.md) - Request/response examples
- 🚌 [Bus Module Summary](BUS_MODULE_SUMMARY.md) - Bus management details
- 🛣️ [Route Module Documentation](ROUTE_MODULE_DOCUMENTATION.md) - Route management guide
- 📋 [Route API Examples](ROUTE_API_EXAMPLES.md) - Route endpoint examples
- 🎫 [Ticket Module Documentation](TICKET_MODULE_DOCUMENTATION.md) - Ticket booking guide
- 📝 [Ticket API Examples](TICKET_API_EXAMPLES.md) - Ticket endpoint examples
- 💳 [Payment Module Documentation](PAYMENT_MODULE_DOCUMENTATION.md) - Payment integration guide
- 🔌 [WebSocket Documentation](WEBSOCKET_DOCUMENTATION.md) - Real-time updates guide
- ⚡ [WebSocket Quick Reference](WEBSOCKET_QUICK_REFERENCE.md) - WebSocket quick start
- 🗄️ [Database Structure](DATABASE_STRUCTURE.md) - Schema and relationships

## Current Implementation Status

✅ **Completed**
- [x] Project setup with NestJS & Prisma
- [x] Database schema design
- [x] Authentication module (JWT, roles)
- [x] Bus management module (CRUD)
- [x] Bus specifications system
- [x] Route management module (CRUD, search)
- [x] Ticket booking system (reservation, confirmation, cancellation)
- [x] Payment integration (iyzico with mock fallback)
- [x] WebSocket for real-time seat updates
- [x] Role-based access control
- [x] Double-booking prevention

🔄 **In Progress**
- [ ] Admin dashboard APIs
- [ ] Advanced analytics
- [ ] Email notifications

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Bus Management
- `POST /buses` - Create bus (Admin)
- `GET /buses` - List all buses
- `GET /buses/:id` - Get bus details
- `GET /buses/plate/:plate` - Get bus by plate
- `PATCH /buses/:id` - Update bus (Admin)
- `DELETE /buses/:id` - Delete bus (Admin)
- `GET /buses/stats` - Bus statistics (Admin/Agent)

### Route Management
- `POST /routes` - Create route (Admin/Agent)
- `GET /routes` - List all routes
- `GET /routes/search` - Search routes
- `GET /routes/:id` - Get route details
- `GET /routes/upcoming` - Get upcoming routes
- `GET /routes/popular` - Get popular routes
- `PATCH /routes/:id` - Update route (Admin/Agent)
- `DELETE /routes/:id` - Delete route (Admin)
- `GET /routes/stats` - Route statistics (Admin/Agent)

### Ticket Management
- `POST /tickets` - Book ticket (Authenticated)
- `GET /tickets/my-tickets` - Get user's tickets
- `GET /tickets/pnr/:pnr` - Find ticket by PNR
- `GET /tickets/available-seats/:routeId` - Check available seats
- `GET /tickets/search` - Search tickets
- `PATCH /tickets/:id` - Update ticket
- `PATCH /tickets/:id/confirm` - Confirm booking
- `PATCH /tickets/:id/suspend` - Suspend ticket (Admin/Agent)
- `PATCH /tickets/:id/cancel` - Cancel ticket
- `GET /tickets/stats` - Ticket statistics (Admin/Agent)

### Payment Management
- `POST /payments` - Process payment (Authenticated)
- `GET /payments/history` - Get payment history
- `POST /payments/refund/:ticketId` - Process refund

### WebSocket (Real-time)
- `ws://localhost:3000/seats` - WebSocket endpoint
- `subscribe_route` - Subscribe to route updates
- `unsubscribe_route` - Unsubscribe from route
- `seat_update` - Receive seat status changes

## Database Models

### Bus
- `id` - UUID
- `plate` - Unique license plate
- `model` - Bus model
- `seatCount` - Number of seats
- `layoutType` - Seat layout (2+1, 2+2, 1+2)
- `specs` - Relation to BusSpecs

### BusSpecs
- Detailed specifications in separate table
- Brand, year, engine type, fuel type
- Features: AC, WiFi, toilet, TV
- Custom features array

See [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) for complete schema.

## Frontend Integration

This backend is designed to work with a Nuxt.js frontend. All endpoints follow RESTful conventions with proper CORS support.

**CORS Configuration:**
- Allowed origins: `http://localhost:3000`, `http://localhost:3001`
- Credentials: enabled

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Production mode
npm run start:prod

# Run tests
npm run test

# Prisma Studio (Database GUI)
npm run prisma:studio
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bus_ticketing"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
PORT=3000
```

## License

MIT
