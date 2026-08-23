# StayNest

**Full-Stack Vacation Rental Marketplace**

> Phase 1 — Database + Docker &nbsp;|&nbsp; Status: **In Progress**

StayNest is a full-stack vacation rental marketplace built as a professional portfolio project. It demonstrates modern web (Next.js), mobile (Flutter), and backend (NestJS) engineering on a modular monolith architecture with PostgreSQL, Redis, MinIO, Docker, Kubernetes, and CI/CD.

---

## Current Status

**Phase 1: Database + Docker** (in progress)

- [x] PostgreSQL development environment (Docker)
- [x] Redis development environment (Docker)
- [x] MinIO development environment (Docker)
- [x] Docker Compose configuration
- [x] PostgreSQL database schema (Prisma)
- [x] Database migrations
- [x] Development seed data
- [x] NestJS database integration (Prisma)
- [x] Basic database health verification
- [x] Redis connectivity verification
- [x] MinIO connectivity verification
- [x] Documentation of infrastructure start/stop

**Phase 0: Project Foundation** — complete.

Planned phases are listed in the [Development Roadmap](#development-roadmap).

---

## Technology Stack

### Web Application
- **Next.js** (App Router) + TypeScript

### Mobile Application
- **Flutter** + Dart

### Backend
- **NestJS** + Node.js + TypeScript (modular monolith)
- **REST API**
- **Prisma ORM** (PostgreSQL data layer)

### Database & Infrastructure
- **PostgreSQL** 17 (database)
- **Redis** 7 (cache)
- **MinIO** (S3-compatible object storage)
- **Docker** + Docker Compose
- **Kubernetes** (Minikube/Kind — planned for Phase 13)
- **Terraform** (IaC — planned for Phase 16)
- **GitHub Actions** (CI/CD — planned for Phase 15)
- **SonarQube** (code quality — planned for Phase 14)
- **Trivy** + OWASP Dependency-Check (security — planned for Phase 14)

### Third-Party Services
- **Stripe** (test mode only — Phase 6)
- **JWT** (authentication — Phase 3)

---

## Application Roles

| Role    | Description                                                                                                                                                   |
|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Guest   | Browse properties, search and filter, view property details, check availability, create bookings, make test payments, manage bookings, add reviews, manage favorites, manage profile. |
| Host    | Create/edit/delete properties, upload property images, manage pricing and availability, manage bookings, view earnings, manage profile.                       |
| Admin   | Manage users, manage properties, manage bookings, manage payments, moderate reviews, handle reports, view platform statistics.                                  |

---

## Development Roadmap

| Phase | Description                                                  | Status    |
|-------|--------------------------------------------------------------|-----------|
| 0     | Project Foundation                                           | Complete  |
| 1     | Database + Docker (PostgreSQL, Redis, MinIO, Docker Compose) | In Progress |
| 2     | NestJS Backend Foundation (modular structure, config)        | Planned  |
| 3     | Authentication + RBAC (JWT, role-based guards)               | Planned  |
| 4     | Property / Listing Service                                   | Planned  |
| 5     | Booking Service                                              | Planned  |
| 6     | Payment Service (Stripe test mode)                           | Planned  |
| 7     | Reviews + Favorites                                          | Planned  |
| 8     | MinIO / Image Storage                                        | Planned  |
| 9     | Admin Service                                                | Planned  |
| 10    | Next.js Web Application (full marketplace UI)                | Planned  |
| 11    | Flutter Mobile Application                                   | Planned  |
| 12    | Dockerization + Docker Compose                              | Planned  |
| 13    | Kubernetes - Minikube / Kind                                 | Planned  |
| 14    | Testing + Security (Trivy, OWASP)                            | Planned  |
| 15    | GitHub Actions CI/CD                                         | Planned  |
| 16    | Terraform / Infrastructure as Code                           | Planned  |
| 17    | Final Deployment                                             | Planned  |
| 18    | Documentation + Portfolio                                    | Planned  |

> Features listed under future phases are **not yet implemented**.

---

## Local Development Prerequisites

### Required
- Node.js v20+ and npm v10+
- Git
- Docker Desktop

### Installed During Later Phases
- kubectl
- Minikube or Kind
- Terraform
- Flutter + Dart SDK
- SonarQube Community Edition

---

## Quick Start

### Start Infrastructure

```bash
# From the project root
docker compose up -d

# Verify services
docker compose ps
```

### Apply Database Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

### Seed Development Data

```bash
cd apps/api
npx prisma db seed
```

### Start the API

```bash
npm run dev:api
```

### Verify Health

```bash
npm run dev:web
```

Open http://localhost:3000 for the web app, or http://localhost:3000/health for the API health check.

### Stop Everything

```bash
docker compose down -v   # stop + remove volumes (data loss)
docker compose down      # stop + keep data
```

See [docs/operations.md](docs/operations.md) for detailed instructions.

---

## Project Structure

```
staynest/
├── apps/
│   ├── api/
│   │   ├── prisma/        # Prisma schema, migrations, seed
│   │   ├── src/
│   │   │   ├── config/    # Env validation, configuration
│   │   │   ├── health/    # Health check endpoint
│   │   │   ├── minio/     # MinIO (S3-compatible storage) service
│   │   │   ├── prisma/    # Prisma client service + module
│   │   │   ├── redis/     # Redis service + module
│   │   │   └── main.ts    # NestJS bootstrap
│   │   └── prisma.config.ts
│   ├── web/          # Next.js web application
│   └── mobile/       # Flutter mobile app (initialized in Phase 11)
├── infrastructure/
│   ├── docker/
│   │   └── Dockerfile.api  # NestJS app Dockerfile (skeleton)
│   ├── kubernetes/
│   └── terraform/
├── docs/
│   ├── architecture.md
│   └── operations.md
├── tests/
│   └── e2e/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── docker-compose.yml   # Development infrastructure (PostgreSQL, Redis, MinIO)
├── package.json         # Root workspace manifest
├── README.md
└── AGENTS.md
```

---

## Zero-Cost Constraint

This project is a **portfolio/demo only**. It requires **no paid services**:

- No AWS, GCP, or Azure
- No paid cloud databases
- No paid authentication providers
- No paid storage services
- Stripe remains **test mode only** — no real payment processing

All services run locally via Docker Compose.

---

## License

This project is for educational/portfolio purposes. All rights reserved.