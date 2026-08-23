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
- **HealthModule** — `GET /health` endpoint with database, Redis, and MinIO connectivity checks

### Development Workflow

1. `docker compose up -d` — start infrastructure
2. `npx prisma migrate dev --name <name>` — create and apply migrations
3. `npx prisma db seed` — seed development data
4. `npm run dev:api` — start NestJS in watch mode
5. `curl http://localhost:3000/health` — verify health

### Future Phases

- Phase 2: NestJS modular structure (Auth, Users, Properties, Bookings, Payments, etc.)
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