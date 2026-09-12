# FleetFlow

A multi-tenant logistics and order-tracking platform — a portfolio project demonstrating full-stack, real-time, and distributed-systems engineering.

> **Status:** early scaffold (Milestones 1–2 of the roadmap). Auth, tenancy/RBAC, orders with a validated state machine, public shipment tracking, real-time driver location via WebSockets + Redis, route optimization, inventory, notifications, webhooks, and analytics are stubbed or implemented at a foundational level. See "What's implemented" below for the honest current state.

## Overview

FleetFlow lets a logistics company manage orders, drivers, vehicles, warehouses, and routes, gives customers a public shipment-tracking page, and gives dispatchers a live map of their fleet. Full product requirements and design rationale live in `FleetFlow-Architecture.md` (the Phase 1 design doc this build follows).

## Architecture

```
Next.js (web) ──HTTP──▶ NestJS API ──▶ PostgreSQL (Prisma)
              ──WSS───▶   │      └──▶ Redis (pub/sub, cache, queues)
                          └──▶ BullMQ workers (notifications, webhooks,
                                location batching, analytics rollups)
```

- **Tenant isolation:** application-layer `companyId` scoping + Postgres Row-Level Security (`prisma/rls.sql`) as defense-in-depth.
- **RBAC:** permission-guarded on every endpoint (`@RequirePermission`), not just hidden in the UI.
- **Real-time tracking:** driver GPS pings buffer in Redis, fan out to dispatchers via Socket.IO + Redis pub/sub, and batch-persist to Postgres every 10s — never one DB write per ping.
- **Order lifecycle:** a pure, exhaustively unit-tested state machine (`apps/api/src/modules/orders/domain/order-state-machine.ts`) is the single source of truth for valid status transitions.

Full detail — ERD, API design, event architecture, Redis strategy, security model, folder structure — is in `FleetFlow-Architecture.md`.

## What's implemented

- Auth (register/login/refresh, bcrypt + JWT)
- Multi-tenancy + RBAC guard/decorator + RLS policy script
- Orders: create, list, assign (concurrency-safe via serializable transaction), validated state transitions
- Public shipment tracking endpoint + page (`/track/[trackingNumber]`)
- Drivers, vehicles, warehouses, inventory: CRUD + availability/status
- Routes: nearest-neighbor optimization heuristic (unit tested), swappable for a real optimizer later
- Tracking: WebSocket gateway, Redis-buffered location ingestion, scheduled batch-persistence job
- Notifications & webhooks: event-driven, BullMQ-backed, webhook delivery is HMAC-signed
- Analytics: Redis-cached overview endpoint
- Audit log: event-driven, append-only
- Web app: landing page, tracking page, dashboard shell, driver app shell
- Docker Compose, Dockerfiles, GitHub Actions CI, Prisma seed script with demo data

## Not yet implemented (see roadmap)

- Proof-of-delivery capture UI + S3 signed-upload flow
- Failed-delivery / redelivery workflow UI
- Full dashboard pages beyond the shell (orders table, driver detail, route builder UI, live map rendering)
- Outbox pattern for crash-safe event dispatch (events currently emit in-process — see `SECURITY.md` known gaps)
- Playwright E2E suite
- OpenTelemetry integration

## Running locally

```bash
cp .env.example .env          # fill in secrets
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed           # creates [email protected] / DemoPass123!

# in separate terminals
npm run dev:api               # http://localhost:4000
npm run dev:web               # http://localhost:3000

# or, full stack via Docker:
docker compose -f docker/docker-compose.yml up --build
```

Apply Row-Level Security after your first migration:
```bash
psql "$DATABASE_URL" -f prisma/rls.sql
```

## Testing

```bash
npm run test -w apps/api      # order state machine, route optimization heuristic, etc.
```

## Environment variables

See `.env.example` for the full list (database, Redis, JWT secrets, OAuth, S3, map provider, email/SMS provider).

## Engineering decisions & trade-offs

- **NestJS modular monolith, not microservices** — one deployable is realistic for a solo-developer project while the module boundaries (each owns its own service/repository/DTOs and talks to others only via domain events) keep the door open to splitting services later.
- **Redis buffering for GPS pings** — writing every location ping straight to Postgres doesn't scale past a handful of drivers; batching through Redis and flushing on a schedule bounds write amplification.
- **Nearest-neighbor route heuristic** — true route optimization is NP-hard; a heuristic is realistic for a portfolio project and is isolated behind a pure function so a real solver (OR-Tools, a mapping provider's optimization API) can replace it without touching callers.
- **RLS as defense-in-depth, not the only tenant guard** — relying solely on RLS makes debugging harder and doesn't scope query planning; relying solely on app-layer scoping leaves no safety net for a missed filter. Doing both costs little and closes that gap.

## Resume / interview content

See `FleetFlow-Architecture.md` §46 areas of the original design doc for prepared interview-answer topics (scaling GPS updates, tenant isolation, concurrent driver assignment, route optimization, disaster recovery). Resume bullets and a GitHub description will be finalized once the remaining milestones land.
