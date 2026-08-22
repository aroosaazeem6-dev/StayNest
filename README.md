# StayNest

**Full-Stack Vacation Rental Marketplace**

> Phase 0 - Project Foundation | Status: **In Progress**

StayNest is a full-stack vacation rental marketplace built as a professional portfolio project. It demonstrates modern web (Next.js), mobile (Flutter), and backend (NestJS) engineering on a modular monolith architecture with PostgreSQL, Redis, MinIO, Docker, Kubernetes, and CI/CD.

---

## Current Status

**Phase 0: Project Foundation** (in progress)

- [x] Monorepo structure established (npm workspaces)
- [x] NestJS backend foundation (`apps/api`)
- [x] Next.js web foundation (`apps/web`)
- [x] Mobile placeholder (`apps/mobile`)
- [x] Infrastructure skeleton (Docker, Kubernetes, Terraform)
- [x] Documentation skeleton
- [x] Root workspace configuration

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

### Database & Infrastructure
- **PostgreSQL** (primary database)
- **Redis** (cache)
- **MinIO** (object storage / S3-compatible)
- **Docker** + Docker Compose
- **Kubernetes** (Minikube/Kind for local dev)
- **Terraform** (infrastructure as code)
- **GitHub Actions** (CI/CD)
- **SonarQube** (code quality)
- **Trivy** + OWASP Dependency-Check (security)

### Third-Party Services
- **Stripe** (test mode only)
- **JWT** (authentication)

---

## Application Roles

| Role    | Description                                                                                                                                                   |
|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Guest   | Browse properties, search and filter, view property details, check availability, create bookings, make test payments, manage bookings, add reviews, manage favorites, manage profile. |
| Host    | Create/edit/delete properties, upload property images, manage pricing and availability, manage bookings, view earnings, manage profile.                       |
| Admin   | Manage users, manage properties, manage bookings, manage payments, moderate reviews, handle reports, view platform statistics.                                  |

---

## Development Roadmap

| Phase | Description                                           | Status   |
|-------|-------------------------------------------------------|----------|
| 0     | Project Foundation                                    | In Progress |
| 1     | Database + Docker (PostgreSQL, Redis, Docker Compose) | Planned  |
| 2     | NestJS Backend Foundation (modular structure, config, health checks) | Planned  |
| 3     | Authentication + RBAC (JWT, role-based guards)        | Planned  |
| 4     | Property / Listing Service                            | Planned  |
| 5     | Booking Service                                       | Planned  |
| 6     | Payment Service (Stripe test mode)                    | Planned  |
| 7     | Reviews + Favorites                                   | Planned  |
| 8     | MinIO / Image Storage                                 | Planned  |
| 9     | Admin Service                                         | Planned  |
| 10    | Next.js Web Application (full marketplace UI)         | Planned  |
| 11    | Flutter Mobile Application                            | Planned  |
| 12    | Dockerization + Docker Compose                        | Planned  |
| 13    | Kubernetes - Minikube / Kind                            | Planned  |
| 14    | Testing + Security (Trivy, OWASP)                     | Planned  |
| 15    | GitHub Actions CI/CD                                  | Planned  |
| 16    | Terraform / Infrastructure as Code                    | Planned  |
| 17    | Final Deployment                                      | Planned  |
| 18    | Documentation + Portfolio                             | Planned  |

> Features listed under future plan are **not yet implemented**.

---

## Local Development Prerequisites

### Required
- Node.js v20+ and npm v10+
- Git

### Installed During Later Phases
- Docker + Docker Compose
- kubectl
- Minikube or Kind
- Terraform
- Flutter + Dart SDK
- SonarQube Community Edition

---

## Project Structure

```
staynest/
├── apps/
│   ├── api/          # NestJS backend (modular monolith)
│   ├── web/          # Next.js web application
│   └── mobile/       # Flutter mobile app (initialized in Phase 11)
├── infrastructure/
│   ├── docker/       # Dockerfiles, docker-compose
│   ├── kubernetes/   # Helm charts, k8s manifests
│   └── terraform/    # IaC configurations
├── docs/             # Architecture and design docs
├── tests/
│   └── e2e/          # End-to-end tests
├── .github/
│   └── workflows/    # GitHub Actions CI/CD
├── .env.example
├── .gitignore
├── package.json      # Root workspace manifest
├── README.md
└── AGENTS.md         # Coding conventions for AI agents
```

---

## Getting Started

```bash
# Clone and enter directory
git clone <repo-url>
cd staynest

# Install all workspace dependencies
npm install

# Start the web app (development)
npm run dev:web

# Start the API (development)
npm run dev:api
```

---

## Zero-Cost Constraint

This project is a **portfolio/demo only**. It requires **no paid services**:

- No AWS, GCP, or Azure
- No paid cloud databases
- No paid authentication providers
- No paid storage services
- Stripe remains **test mode only** — no real payment processing

All services run locally via Docker Compose or Minikube/Kind.

---

## License

This project is for educational/portfolio purposes. All rights reserved.
