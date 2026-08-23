# Development Operations Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Docker Desktop | 4.x |
| Docker Compose | v2.x |

No other tools are needed for Phase 1.

## Starting Infrastructure

From the project root:

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and MinIO.

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

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "minio": "connected"
  }
}
```

### API Docs

Swagger UI: http://localhost:3000/api/docs

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

## Troubleshooting

### Docker Daemon Not Running

Start Docker Desktop and wait for the whale icon to appear in the system tray.

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