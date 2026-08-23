# Architecture Notes

## Overview

StayNest uses a **modular monolith** architecture. The backend is a single NestJS application with independent, loosely-coupled modules. Each module corresponds to a business domain and can be extracted into a separate service in the future if needed.

## Phase 1 Architecture: Database + Infrastructure

### Infrastructure (Docker Compose)

Three services run in isolated Docker containers with a shared `staynest-network`:

```
docker-compose.yml (root)
  ├── postgres:17-alpine   (port 5432, persistent volume)
  ├── redis:7-alpine       (port 6379, persistent volume, AOF)
  └── minio/minio:latest   (port 9000 API, 9001 Console, persistent volume)
```

All services use environment variables for credentials.
All persistent data survives container restarts (named volumes).

### Data Layer: Prisma 7 ORM

Prisma 7 with the `@prisma/adapter-pg` driver adapter for direct PostgreSQL connections.

- Schema: `apps/api/prisma/schema.prisma`
- Config: `apps/api/prisma.config.ts`
- Migrations: `apps/api/prisma/migrations/`
- Seed: `apps/api/prisma/seed.ts`
- Prisma Client generated to: `node_modules/.prisma/client`

#### Database Schema (10 tables + 1 Prisma tracking table)

| Table | Description |
|-------|-------------|
| `users` | User accounts (GUEST, HOST, ADMIN roles) |
| `properties` | Property listings with location and pricing |
| `property_images` | Image references (MinIO object keys) |
| `amenities` | Lookup table for property amenities |
| `property_amenities` | Many-to-many: properties <-> amenities |
| `availability` | Per-property date availability |
| `bookings` | Guest reservations |
| `payments` | Payment records linked to bookings |
| `reviews` | Guest reviews with rating (CHECK 1-5) |
| `favorites` | Guest favorited properties (unique per user+property) |

#### Key Constraints

- `users.email` — unique
- `amenities.name` — unique
- `property_amenities` — composite primary key `(propertyId, amenityId)`
- `availability` — unique on `(propertyId, date)`
- `bookings` — indexes on propertyId, guestId, status, checkIn, checkOut
- `payments.bookingId` — unique (1:1 with bookings)
- `reviews.bookingId` — unique (1 review per booking)
- `reviews.rating` — CHECK constraint (1-5) via raw SQL
- `favorites` — unique on `(guestId, propertyId)`

### NestJS Integration

- **PrismaModule** (global) — wraps `PrismaService` (extends `PrismaClient` with `PrismaPg` adapter)
- **RedisModule** (global) — wraps `RedisService` (node-redis v4 client)
- **MinioModule** (global) — wraps `MinioService` (minio SDK, auto-creates bucket)
- **HealthModule** — `GET /api/v1/health` endpoint with database, Redis, and MinIO connectivity checks

### Phase 2: Application Layer

#### Module Structure

```
apps/api/src/
├── app.module.ts          # Root module
├── main.ts                # Bootstrap (Helmet, CORS, Versioning, Swagger)
├── config/
│   ├── configuration.ts   # Parsed configuration object
│   └── env.validation.ts  # Joi schema for env vars
├── common/
│   ├── common.module.ts   # Global error filter + response interceptor + logging
│   ├── filters/
│   │   ├── all-exceptions.filter.ts       # Consistent JSON error format
│   │   └── all-exceptions.filter.spec.ts  # Unit tests
│   ├── interceptors/
│   │   ├── response.interceptor.ts        # Success response wrapper { success, data, timestamp }
│   │   └── logging.interceptor.ts         # Request/response timing + status logging
│   └── index.ts           # Barrel exports
├── health/                # Health check endpoints
│   ├── health.controller.ts  # /health, /health/live, /health/ready
│   └── health.module.ts
├── prisma/
│   ├── prisma.service.ts     # PrismaClient with PrismaPg adapter + @Inject(ConfigService)
│   ├── prisma.module.ts       # Global module
├── redis/
│   ├── redis.service.ts      # node-redis v4 client
│   ├── redis.module.ts
├── minio/
│   ├── minio.service.ts      # MinIO SDK client, auto-bucket creation
│   ├── minio.module.ts
```

#### Key Features

- **Global Error Filter**: `@Catch()` filter formats all errors as `{ success: false, error: { code, message, details? }, timestamp, path }`
- **Response Interceptor**: Wraps successful responses as `{ success: true, data, timestamp }`
- **Logging Interceptor**: Logs HTTP method, URL, status code, and duration
- **API Versioning**: URI-based (`/api/v1/...`) with `defaultVersion: '1'` and `prefix: 'api/v'`
- **Health Endpoints**:
  - `GET /api/v1/health` — full health check (database, redis, minio)
  - `GET /api/v1/health/live` — liveness probe (always 200)
  - `GET /api/v1/health/ready` — readiness probe (checks all dependencies)
- **Security**: Helmet middleware for HTTP hardening; CORS configurable via `CORS_ORIGIN` env var
- **Graceful Shutdown**: `app.enableShutdownHooks()` for clean service teardown on SIGINT/SIGTERM
- **Rate Limiting**: (reserved for Phase 2)
- **Swagger/OpenAPI**: Auto-generated docs at `/api/docs` with server configured for `/api/v1`
- **Validation**: Global `ValidationPipe` with `whitelist`, `transform`, `forbidNonWhitelisted`

#### Environment Variables (Phase 2 additions)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3000 | Application port |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `API_PREFIX` | `api/v1` | API version prefix (reserved for future use) |

#### Testing

- **Unit Tests**: `npm run test:unit` — tests in `src/**/*.spec.ts`
- **E2E Tests**: `npm run test:e2e` — tests in `test/*.e2e-spec.ts` with mocked infrastructure services

### Development Workflow

1. `docker compose up -d` — start infrastructure (PostgreSQL, Redis, MinIO)
2. `npx prisma migrate dev --name <name>` — create and apply migrations
3. `npx prisma db seed` — seed development data
4. `npm run dev:api` — start NestJS in watch mode
5. `curl http://localhost:3000/api/v1/health` — verify health

### Future Phases

- Phase 2 (Partial): User, Property, Booking, Payment, Auth, File Upload domains (reserved for future implementation)
- Phase 3: JWT authentication and RBAC guards
- Phase 8: Image upload via MinIO
- Phase 12: Full Dockerization of the NestJS app
- Phase 13: Kubernetes deployment
- Phase 16: Terraform IaC

## Later Phase Architecture (Planned)

- Web: Next.js with App Router, Tailwind CSS
- Mobile: Flutter app consuming REST API
- CI/CD: GitHub Actions with linting, testing, security scanning
- Security: Trivy, OWASP Dependency-Check, SonarQube