# FleetFlow — Security Architecture

## Authentication
- JWT access tokens (15 min) + rotating refresh tokens (7 days).
- Passwords hashed with bcrypt, 12 rounds.
- Dashboard sessions use httpOnly, Secure, SameSite=Strict cookies where cookie-based auth is used; driver/mobile clients use bearer tokens.

## Authorization
- Every protected endpoint declares `@RequirePermission('resource:action')`.
- `PermissionGuard` checks the caller's actual permission set (resolved from their Role via `CompanyMember`) on every request — the frontend hiding a button is a UX nicety, never the enforcement point.
- `SUPER_ADMIN` cross-company access requires an explicit `X-Company-Id` header and is separately audited.

## Tenant isolation
- Application layer: a base repository injects `companyId` into every query automatically.
- Database layer: Postgres Row-Level Security policies (`prisma/rls.sql`) as defense-in-depth — even a bug in application code cannot return cross-tenant rows, because the DB role itself is scoped by session variable.

## Input validation
- `class-validator` DTOs on every endpoint, with `whitelist: true` and `forbidNonWhitelisted: true` so unknown fields are rejected rather than silently dropped or accepted.

## Rate limiting
- Redis-backed token bucket, keyed by API key / user / IP.
- Stricter limits on `/auth/*` (brute-force protection) and the public `/shipments/:trackingNumber` endpoint (enumeration protection).

## File uploads (proof of delivery)
- Type and size validated server-side before a pre-signed S3 URL is issued.
- Files land in a **private** bucket; access is only via short-lived signed URLs generated for an authorized viewer (the submitting driver, that order's customer, or company staff).

## Secrets
- Local development uses `.env` (never committed — see `.env.example`).
- Production should source secrets from a real secret manager (AWS Secrets Manager, Doppler, etc.), injected as environment variables at deploy time.

## API keys
- Stored as salted hashes (`ApiKey.hashedKey`), never in plaintext.
- Shown to the user exactly once, at creation.

## Transport & headers
- HTTPS enforced in all non-local environments.
- `helmet` middleware sets standard secure headers (HSTS, X-Content-Type-Options, etc.).
- CSRF protection applies to cookie-based dashboard sessions; not applicable to pure bearer-token API/driver clients.

## Injection protection
- Prisma parameterizes all queries by default; the one raw SQL call (`SET LOCAL app.current_company_id`) interpolates a UUID that has already been validated as the authenticated user's own companyId, not user-supplied free text.
- React/Next.js escape rendered output by default; `dangerouslySetInnerHTML` is not used anywhere in the codebase.

## Audit logging
- Every significant domain event (order created/assigned/status-changed, driver/vehicle/warehouse changes, permission changes) is written to an append-only `AuditLog` table via the event bus — never editable through the API.

## Known gaps / next steps
- CSRF middleware is referenced but not yet wired into `main.ts` — add before enabling cookie-based dashboard auth in production.
- Outbox-pattern event dispatch (architecture doc §10) is not yet implemented; events are currently emitted in-process, which means a crash between DB commit and event emission could drop a notification/webhook/audit write. Priority fix for Milestone 8.
- API key scopes are stored but not yet enforced per-endpoint.
