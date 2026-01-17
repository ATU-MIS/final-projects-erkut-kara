# Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager

## Step-by-Step Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- NestJS framework
- Prisma ORM
- JWT authentication
- Validation libraries
- And more...

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file with your settings:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/bus_ticketing?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"

# Server Configuration
PORT=3000
```

**Important:** 
- Replace `username` and `password` with your PostgreSQL credentials
- Generate a strong JWT secret for production
- Change the database name if needed

### 3. Set Up PostgreSQL Database

#### Option A: Using pgAdmin or PostgreSQL CLI

```sql
CREATE DATABASE bus_ticketing;
```

#### Option B: Using Command Line

```bash
# Windows
psql -U postgres
CREATE DATABASE bus_ticketing;
\q

# Linux/Mac
createdb bus_ticketing
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client based on your schema.

### 5. Run Database Migrations

```bash
npm run prisma:migrate
```

When prompted for a migration name, enter something descriptive like:
```
init
```

This will:
- Create all database tables
- Set up relationships
- Create indexes
- Apply constraints

### 6. (Optional) Open Prisma Studio

To view and manage your database through a GUI:

```bash
npm run prisma:studio
```

This opens a browser at `http://localhost:5555` with a visual database editor.

### 7. Start the Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

You should see:
```
Application is running on: http://localhost:3000
```

## Verify Installation

### Test the API

1. **Health Check** (if implemented):
```bash
curl http://localhost:3000
```

2. **Register a User**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "role": "ADMIN"
  }'
```

3. **Login**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Save the returned token for authenticated requests.

4. **Create a Bus** (use token from login):
```bash
curl -X POST http://localhost:3000/buses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "plate": "34ABC123",
    "model": "Travego 17 SHD",
    "seatCount": 48,
    "layoutType": "LAYOUT_2_1",
    "specs": {
      "brand": "Mercedes-Benz",
      "year": 2023,
      "hasAC": true,
      "hasWifi": true
    }
  }'
```

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Ensure PostgreSQL port (default 5432) is not blocked
4. Test connection: `psql -U username -d bus_ticketing`

### Prisma Issues

**Error:** `Environment variable not found: DATABASE_URL`

**Solution:**
- Ensure `.env` file exists in root directory
- Verify DATABASE_URL is set correctly
- Restart your terminal/IDE

**Error:** `Prisma schema validation failed`

**Solution:**
```bash
npx prisma format
npx prisma validate
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
- Change PORT in `.env` file
- Or kill the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:3000 | xargs kill
  ```

## Development Scripts

```bash
# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## Production Deployment

### Environment Variables

Set these in your production environment:
```env
DATABASE_URL="postgresql://user:pass@production-host:5432/bus_ticketing"
JWT_SECRET="strong-random-secret-256-bits"
JWT_EXPIRATION="7d"
PORT=3000
NODE_ENV=production
```

### Build and Run

```bash
# Install dependencies (production only)
npm ci --only=production

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate deploy

# Build
npm run build

# Start
npm run start:prod
```

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/main.js --name bus-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## Database Seeding (Optional)

Create a seed file to populate initial data:

```bash
# Create seed file
# prisma/seed.ts

# Run seed
npx prisma db seed
```

## Next Steps

1. ✅ Review API documentation in `API_DOCUMENTATION.md`
2. ✅ Check example requests in `API_EXAMPLES.md`
3. ✅ Read bus module summary in `BUS_MODULE_SUMMARY.md`
4. ✅ Understand database structure in `DATABASE_STRUCTURE.md`
5. ✅ Start building your frontend with Nuxt.js

## Support

For issues and questions:
1. Check the documentation files
2. Review Prisma logs: `npx prisma --help`
3. Check NestJS logs in console
4. Verify database state in Prisma Studio

## Security Notes

⚠️ **Important for Production:**
- Use strong JWT secrets (minimum 256 bits)
- Enable HTTPS/TLS
- Set up proper CORS policies
- Use environment variables for sensitive data
- Implement rate limiting
- Keep dependencies updated
- Use PostgreSQL SSL connections
- Implement proper logging and monitoring
