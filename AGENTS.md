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

## Web (Next.js)

- App Router (`app/`) structure - no Pages Router.
- TypeScript strict mode enabled.
- Server Components by default; mark client components explicitly with `'"'"'use client'"'"'`.
- Use `fetch` or `axios` for API calls.
- Tailwind CSS for styling.

## Mobile (Flutter)

- Standalone Flutter project. Do not treat as an npm workspace member.
- Consumes NestJS REST API via HTTP client (e.g., `dio` or `http`).
- State management: TBD (Riverpod or Bloc - will decide before Phase 11).

## General

- Never commit secrets. Check `.env.example` for the template.
- Keep commits focused - one logical change per commit.
- Run lint and typecheck before committing.
- Write meaningful but concise commit messages.
