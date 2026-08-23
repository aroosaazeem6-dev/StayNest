# AGENTS.md - Coding Conventions for AI Agents

## Overview

This file provides conventions for AI coding agents working on the StayNest project. It supplements (not replaces) project-level documentation.

## Architecture

- Architecture pattern: Modular monolith (NestJS backend). No microservices.
- Workspace: npm workspaces. `apps/api` and `apps/web` are workspace members. `apps/mobile` is a standalone Flutter project.
- API style: REST only. No GraphQL.

## Backend (NestJS)

- TypeScript strict mode enabled.
- Use NestJS decorators and patterns (modules, controllers, providers).
- Each business domain should be its own module (e.g., `properties/`, `bookings/`, `payments/`).
- Modules should be independently extractable (loose coupling) but remain in the monolith.
- Environment variables validated via `@nestjs/config` plus `joi` or `zod`.
- Global pipes: `ValidationPipe` with `whitelist: true` and `transform: true`.
- Database access via Prisma (`@prisma/client`, `prisma` CLI). Schema lives in `apps/api/prisma/schema.prisma`.
- Migrations: `npx prisma migrate dev --name <name>`
- Seeding: `npx prisma db seed` (script in `apps/api/prisma/seed.ts`)
- Prisma client is injected via the global `PrismaModule` which provides `PrismaService`.

## Database (Prisma)

- Prisma 7.x is the ORM. Schema is in `apps/api/prisma/schema.prisma`.
- Model names map to pluralized snake_case tables (e.g., `User` -> `users`).
- Use `@map` for column name overrides.
- Use `@@index` for frequently queried columns.
- Use `@@unique`, `@unique` for uniqueness constraints.
- Use `@@check` for value range constraints (e.g., rating 1-5).
- Enums defined in the Prisma schema for role, status, type fields.
- Decimal fields for monetary values: `@db.Decimal(10, 2)`.
- Date-only fields: `DateTime @db.Date`.

## Web (Next.js)

- App Router (`app/`) structure - no Pages Router.
- TypeScript strict mode enabled.
- Server Components by default; mark client components explicitly with `'"'"'use client'"'"'`.
- Use `fetch` or `axios` for API calls.
- Tailwind CSS for styling.

## Mobile (Flutter)

- Standalone Flutter project. Do not treat as an npm workspace member.
- Will be initialized in Phase 11. Consumes NestJS REST API via HTTP client (`dio` or `http`).
- State management: TBD (Riverpod or Bloc)

## General

- Never commit secrets. Check `.env.example` for the template.
- The local `.env` file is covered by `.gitignore` and must never be committed.
- Keep commits focused - one logical change per commit.
- Run lint and typecheck before committing.
- Write meaningful but concise commit messages.