# Hotel SaaS Backend

A multi-tenant hotel management SaaS platform built with [NestJS](https://nestjs.com/), PostgreSQL, and Prisma.

## Tech Stack

- **Framework**: NestJS 12 (Node.js, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport, Argon2/bcrypt password hashing
- **Validation**: class-validator & class-transformer
- **Observability**: NestJS Observe (distributed tracing, metrics, logging)
- **Testing**: Vitest (unit, e2e, coverage)
- **Linting**: Oxlint with TypeScript support
- **Formatting**: Prettier

## Project Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hotel_saas?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"
PORT=5000
NODE_ENV=development
```

## Compile and Run

```bash
# Development (watch mode)
pnpm run start:dev

# Production build
pnpm run build
pnpm run start:prod
```

The API will be available at `http://localhost:5000/api/v1`

## Database Commands

```bash
# Open Prisma Studio
pnpm prisma studio

# Create a new migration
pnpm prisma migrate dev --name migration_name

# Deploy migrations to production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

## Run Tests

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Linting & Formatting

```bash
# Lint
pnpm run lint

# Format
pnpm run format
```

## Deployment

### Using NestJS Mau (AWS)

```bash
pnpm install -g @nestjs/mau
pnpm run deploy
```

### Docker

```bash
docker build -t hotel-saas-backend .
docker run -p 5000:5000 --env-file .env hotel-saas-backend
```

## API Documentation

The API uses global prefix `/api/v1`. All endpoints are versioned under this prefix.

## Observability

This project is instrumented with [NestJS Observe](https://observe.nestjs.com). To enable:

1. Create a free account at [observe.nestjs.com](https://observe.nestjs.com)
2. Add an application
3. Add the generated app key and secret to `ObserveModule.forRoot()` in `src/app.module.ts`

## Project Structure

```
src/
├── app.module.ts          # Root module
├── main.ts                # Application entry point
├── common/                # Shared utilities, guards, pipes, decorators
├── config/                # Configuration modules
├── modules/               # Feature modules
│   ├── auth/              # Authentication & authorization
│   ├── hotels/            # Hotel management
│   ├── rooms/             # Room management
│   ├── bookings/          # Booking system
│   └── tenants/           # Multi-tenancy
└── prisma/                # Prisma service & extensions
```

## API Routes

All routes are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT token | No |

#### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@hotel.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@hotel.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@hotel.com",
    "password": "password123"
  }'
```

**Response:** Same as register.

---

### Tenants (Hotels)

All tenant routes require JWT authentication.

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/tenants` | Create tenant (hotel) | Yes | Any |
| GET | `/tenants` | List user's tenants | Yes | Any |
| GET | `/tenants/current` | Get current tenant context | Yes | Any |

#### Create Tenant
```bash
curl -X POST http://localhost:5000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Grand Hotel",
    "slug": "grand-hotel"
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Grand Hotel",
  "slug": "grand-hotel",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### List Tenants
```bash
curl -X GET http://localhost:5000/api/v1/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Current Tenant (requires tenant context header)
```bash
curl -X GET http://localhost:5000/api/v1/tenants/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

---

### Rooms

All room routes require JWT authentication and tenant context (`x-tenant-id` header).

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/rooms` | List all rooms | Yes | Any |
| GET | `/rooms/:id` | Get room by ID | Yes | Any |
| POST | `/rooms` | Create room | Yes | OWNER, ADMIN |
| PATCH | `/rooms/:id` | Update room | Yes | OWNER, ADMIN |
| DELETE | `/rooms/:id` | Delete room | Yes | OWNER, ADMIN |

#### List Rooms
```bash
curl -X GET http://localhost:5000/api/v1/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Deluxe Suite",
    "type": "SUITE",
    "price": "299.99",
    "capacity": 2,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### Create Room
```bash
curl -X POST http://localhost:5000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID" \
  -d '{
    "name": "Deluxe Suite",
    "type": "SUITE",
    "price": 299.99,
    "capacity": 2
  }'
```

#### Get Room
```bash
curl -X GET http://localhost:5000/api/v1/rooms/ROOM_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

#### Update Room
```bash
curl -X PATCH http://localhost:5000/api/v1/rooms/ROOM_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID" \
  -d '{
    "price": 349.99,
    "isActive": true
  }'
```

#### Delete Room
```bash
curl -X DELETE http://localhost:5000/api/v1/rooms/ROOM_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

---

### Bookings

All booking routes require JWT authentication and tenant context (`x-tenant-id` header).

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/bookings` | Create booking | Yes | Any |
| GET | `/bookings` | List all bookings | Yes | Any |
| GET | `/bookings/:id` | Get booking by ID | Yes | Any |
| PATCH | `/bookings/:id/cancel` | Cancel booking | Yes | Any |

#### Create Booking
```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID" \
  -d '{
    "roomId": "ROOM_UUID",
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "checkIn": "2024-02-15",
    "checkOut": "2024-02-18",
    "guests": 2
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "roomId": "uuid",
  "userId": "uuid",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "checkIn": "2024-02-15T00:00:00.000Z",
  "checkOut": "2024-02-18T00:00:00.000Z",
  "guests": 2,
  "total": "899.97",
  "status": "CONFIRMED",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### List Bookings
```bash
curl -X GET http://localhost:5000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

#### Get Booking
```bash
curl -X GET http://localhost:5000/api/v1/bookings/BOOKING_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

#### Cancel Booking
```bash
curl -X PATCH http://localhost:5000/api/v1/bookings/BOOKING_UUID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: TENANT_UUID"
```

---

## Demo Data & Token Flow

### Quick Start Script

```bash
#!/bin/bash
# Save as demo.sh and run: chmod +x demo.sh && ./demo.sh

BASE_URL="http://localhost:5000/api/v1"

echo "=== 1. Register User ==="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@hotel.com", "password": "demo123456"}')
echo "$REGISTER_RESPONSE"

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
echo "Token: $TOKEN"

echo -e "\n=== 2. Create Tenant ==="
TENANT_RESPONSE=$(curl -s -X POST "$BASE_URL/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Demo Hotel", "slug": "demo-hotel"}')
echo "$TENANT_RESPONSE"

TENANT_ID=$(echo "$TENANT_RESPONSE" | jq -r '.id')
echo "Tenant ID: $TENANT_ID"

echo -e "\n=== 3. Create Rooms ==="
ROOM1=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{"name": "Standard Room", "type": "STANDARD", "price": 149.99, "capacity": 2}')
echo "Room 1: $ROOM1"

ROOM2=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{"name": "Deluxe Suite", "type": "SUITE", "price": 299.99, "capacity": 4}')
echo "Room 2: $ROOM2"

ROOM_ID=$(echo "$ROOM1" | jq -r '.id')
echo "Room ID: $ROOM_ID"

echo -e "\n=== 4. List Rooms ==="
curl -s -X GET "$BASE_URL/rooms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq

echo -e "\n=== 5. Create Booking ==="
BOOKING=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "roomId": "'$ROOM_ID'",
    "guestName": "Jane Smith",
    "guestEmail": "jane@example.com",
    "checkIn": "2024-03-10",
    "checkOut": "2024-03-12",
    "guests": 2
  }')
echo "$BOOKING"

echo -e "\n=== 6. List Bookings ==="
curl -s -X GET "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq

echo -e "\n=== Demo Complete ==="
echo "Use this token for authenticated requests:"
echo "$TOKEN"
echo "Use this tenant ID for x-tenant-id header:"
echo "$TENANT_ID"
```

### Sample JWT Token Structure

The JWT payload contains:
```json
{
  "sub": "USER_UUID",
  "iat": 1705315200,
  "exp": 1705401600
}
```

The `AuthenticatedRequest` extends Express Request with:
```typescript
{
  user: {
    sub: "USER_UUID",      // User ID
    tenantId: "TENANT_UUID", // Current tenant context
    role: "OWNER"          // MembershipRole: OWNER | ADMIN | RECEPTIONIST
  }
}
```

### Role-Based Access

| Role | Tenants | Rooms (Read) | Rooms (Write) | Bookings |
|------|---------|--------------|---------------|----------|
| OWNER | Full CRUD | Yes | Yes | Full |
| ADMIN | Read | Yes | Yes | Full |
| RECEPTIONIST | Read | Yes | No | Full |

### Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden (insufficient role):**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**400 Bad Request (validation):**
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Room not found",
  "error": "Not Found"
}
```

---

## License

UNLICENSED - Private project