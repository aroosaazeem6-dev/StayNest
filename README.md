# 🏡 StayNest — AI-Powered Vacation Rental Marketplace

<p align="center">
  <strong>A secure, modular full-stack vacation rental marketplace for discovering properties, managing listings, booking stays, processing payments, and evolving toward AI-powered stay assistance.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Redis-Caching-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger">
  <img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Jest-Testing-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest">
  <img src="https://img.shields.io/badge/Supertest-E2E%20Testing-333333?style=for-the-badge" alt="Supertest">
  <img src="https://img.shields.io/badge/JazzCash-Sandbox%2FUAT-008000?style=for-the-badge" alt="JazzCash">
</p>

<p align="center">

**Modular Monolith • Secure • API-First • Role-Based • Dockerized • Testable • Scalable**

</p>

---

# 📌 Project Overview

**StayNest** is a full-stack vacation rental marketplace designed to provide a secure platform for discovering properties, managing listings, checking availability, booking stays, processing payments, submitting reviews, and saving favorite properties.

The project is being developed through a structured **20-phase engineering roadmap**, gradually evolving from a backend foundation into a complete marketplace with web, mobile, and AI-powered capabilities.

The currently completed system includes:

- 🔐 JWT authentication
- 👥 Role-Based Access Control
- 🏠 Property and listing management
- 🔎 Property search and discovery
- 📅 Availability checking
- 🛎️ Booking management
- 💳 JazzCash Sandbox/UAT payment integration
- ⭐ Reviews and ratings
- ❤️ Favorite properties
- 🐘 PostgreSQL database
- 🔷 Prisma ORM
- ⚡ Redis infrastructure
- 📦 MinIO infrastructure
- 🐳 Docker-based infrastructure
- 📚 Swagger/OpenAPI documentation
- 🧪 Unit and E2E testing foundation

Future phases will extend StayNest with an administrative dashboard, web application, mobile application, RAG-based capabilities, AI stay assistance, AI agents, deployment, CI/CD, and production-level improvements.

---

# 🚧 Project Status

### Completed: Phases 0–8

### Next: Phase 9

| Phase | Module | Status |
|---|---|---|
| 0 | Project Foundation | ✅ Complete |
| 1 | Database + Docker Infrastructure | ✅ Complete |
| 2 | NestJS Backend Foundation | ✅ Complete |
| 3 | Authentication + RBAC | ✅ Complete |
| 4 | Property + Listing Management | ✅ Complete |
| 5 | Search + Discovery | ✅ Complete |
| 6 | Availability + Booking | ✅ Complete |
| 7 | Payments | ✅ Complete |
| 8 | Reviews + Favorites | ✅ Complete |
| 9 | Admin Dashboard | ⏳ Planned |
| 10 | Web Application | ⏳ Planned |
| 11 | Flutter Mobile Application | ⏳ Planned |
| 12 | AI/RAG Foundation | ⏳ Planned |
| 13 | AI Stay Assistant | ⏳ Planned |
| 14 | AI Agent + Hybrid Retrieval | ⏳ Planned |
| 15 | Testing + Quality | ⏳ Planned |
| 16 | Docker + Deployment | ⏳ Planned |
| 17 | CI/CD + DevOps | ⏳ Planned |
| 20 | Final Portfolio + Production Polish | ⏳ Planned |

> **Note:** Kubernetes and Terraform/Infrastructure-as-Code are intentionally not included in the current roadmap and may be introduced later depending on project timeline.

---

# 🛠️ Technology Stack

## Backend

- **Node.js**
- **TypeScript**
- **NestJS**
- **REST API**
- **Prisma ORM**
- **PostgreSQL**
- **JWT**
- **Passport**
- **bcryptjs**
- **class-validator**
- **class-transformer**

## Infrastructure & Services

- **Docker**
- **Docker Compose**
- **PostgreSQL**
- **Redis**
- **MinIO**

## API & Documentation

- **RESTful API**
- **Swagger / OpenAPI**
- **API Versioning**
- **DTO-based request validation**

## Authentication & Security

- JWT authentication
- Passport
- bcrypt password hashing
- Role-Based Access Control
- Authentication guards
- Role decorators
- Global request validation
- Ownership validation
- HMAC-SHA256 payment verification

## Payments

- **JazzCash Sandbox / UAT**
- HTTP POST / Page Redirection
- HMAC-SHA256 secure hashing
- PKR payment processing
- Payment callback handling
- Payment state management

## Testing

- **Jest**
- **Supertest**
- NestJS TestingModule
- Unit testing
- E2E testing

## Development

- **Git**
- **GitHub**
- **pnpm**
- **VS Code**

## Planned Technologies

The following technologies/features are part of upcoming phases and are **not yet considered completed**:

- React Web Application
- Flutter Mobile Application
- RAG
- AI Stay Assistant
- AI Agent
- Hybrid Retrieval

---

# 🏗️ Architecture

StayNest currently follows a **Modular Monolith Architecture**.

The backend is intentionally organized into separate business modules while remaining within a single NestJS application.

This approach provides clear domain separation without introducing unnecessary microservice complexity during the current development stage.

## High-Level Architecture

```mermaid
flowchart TD
    Client[Web / Mobile Client]

    API[NestJS REST API]

    Auth[Auth Module]
    Property[Property Module]
    Booking[Booking Module]
    Payment[Payment Module]
    Review[Review Module]
    Favorite[Favorite Module]

    Prisma[Prisma ORM]
    DB[(PostgreSQL)]

    Redis[(Redis)]
    Minio[(MinIO)]

    Client --> API

    API --> Auth
    API --> Property
    API --> Booking
    API --> Payment
    API --> Review
    API --> Favorite

    Auth --> Prisma
    Property --> Prisma
    Booking --> Prisma
    Payment --> Prisma
    Review --> Prisma
    Favorite --> Prisma

    Prisma --> DB

    API --> Redis
    API --> Minio