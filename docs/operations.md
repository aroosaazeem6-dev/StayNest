# Development Operations Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Docker Desktop | 4.x |
| Docker Compose | v2.x |

## Starting Infrastructure

From the project root:

```bash
docker compose up -d
```

This starts PostgreSQL (17-alpine), Redis (7-alpine), and MinIO (latest).

### Check Service Status

```bash
docker compose ps
```

### View Logs

```bash
docker compose logs -f
```

To tail a specific service:

```bash
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f minio
```

## Stopping Infrastructure

```bash
# Stop containers but keep data
docker compose down

# Stop containers AND remove volumes (data loss!)
docker compose down -v
```

## PostgreSQL

### Connection Details

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | staynest |
| User | staynest |
| Password | staynest_pass |

### Connecting via psql

```bash
docker compose exec postgres psql -U staynest -d staynest
```

## Redis

### Connection Details

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 6379 |

### Connecting via redis-cli

```bash
docker compose exec redis redis-cli ping
```

## MinIO

### Connection Details

| Parameter | Value |
|-----------|-------|
| API URL | http://localhost:9000 |
| Console URL | http://localhost:9001 |
| Access Key | minioadmin |
| Secret Key | minioadmin123 |

### MinIO Credentials

Set these as environment variables for CLI tools:

```bash
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin123
```

### Web Console

Open http://localhost:9001 in your browser. Use `minioadmin` / `minioadmin123`.

## NestJS API

### Development

```bash
npm run dev:api
```

The API starts on http://localhost:3000.

### Build

```bash
npm run build:api
```

Output: `apps/api/dist/`

### Type Check

```bash
npm run typecheck:api
```

### Run Production Build

```bash
npm run start:prod
```

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-01T00:00:00.000Z",
    "checks": {
      "database": "connected",
      "redis": "connected",
      "minio": "connected"
    }
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Liveness / Readiness Probes

```bash
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
```

### API Docs

Swagger UI: http://localhost:3000/api/docs

### API Versioning

All API routes are versioned via URI prefix: `/api/v1/...`

### Environment Variables

Required environment variables are defined in `.env.example`. Copy to `.env`:

```bash
cp .env.example .env
```

### Testing

Run all tests:

```bash
npm run test:unit
npm run test:e2e
```

## Prisma

### Generate Client

```bash
cd apps/api
npx prisma generate
```

### Database Migrations

Create and apply a migration:

```bash
cd apps/api
npx prisma migrate dev --name <migration_name>
```

Reset the database (drops and recreates schema + runs migrations):

```bash
cd apps/api
npx prisma migrate reset
```

### Seeding

```bash
cd apps/api
npx prisma db seed
```

### Prisma Studio

```bash
cd apps/api
npx prisma studio
```

### Format Schema

```bash
cd apps/api
npx prisma format
```

## Graceful Shutdown

The API supports graceful shutdown via SIGTERM/SIGINT. On shutdown:
1. Express stops accepting new requests
2. `onModuleDestroy` hooks are called for Prisma, Redis, and MinIO
3. Process exits cleanly

To test:
```bash
kill -SIGTERM <pid>
```

## Common Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all infrastructure services |
| `docker compose down -v` | Stop services and wipe volumes |
| `npm run dev:api` | Start API in watch mode |
| `npm run build:api` | Build production bundle |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npx prisma migrate dev` | Create & apply migration |
| `npx prisma db seed` | Seed database |
| `npx prisma studio` | Open Prisma Studio |

## Troubleshooting

### Docker Daemon Not Running

Start Docker Desktop and wait for the whale icon to appear in the system tray. Then:

```bash
docker compose up -d
```

### Port Already in Use

```bash
docker compose down
docker compose up -d --force-recreate
```

### Database Not Migrated

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

### Health Check Shows Degraded

1. Verify all containers are healthy: `docker compose ps`
2. Check logs: `docker compose logs -f <service>`
3. Restart containers: `docker compose down && docker compose up -d`
4. Verify database: `docker compose exec postgres pg_isready -U staynest -d staynest`

### API Returns 404 for Health Routes

Health endpoints are versioned at `/api/v1/health`, not `/health`. Use:
```bash
curl http://localhost:3000/api/v1/health
```