# Proxsoft Invoice Intake

## Overview
A multi-tenant invoice intake service built for the Proxsoft Task 2. This Next.js (App Router) application provides a single UI page to submit invoices while enforcing strict tenant data isolation entirely at the database layer. 

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Drizzle ORM + PostgreSQL
- Zod (Validation)
- Tailwind CSS (UI)
- Vitest (Testing)

## Architecture
- `src/app/page.tsx`: Simple UI for submitting invoices. Checks strict status codes (no fake successes).
- `src/app/api/invoices/route.ts`: Core POST/GET logic enforcing tenant security.
- `src/lib/invoice-schema.ts`: Strict Zod validation.
- `src/lib/auth.ts`: Basic development session mocking.

## Database Setup
1. Duplicate `.env.example` to `.env.local`
2. Update `DATABASE_URL` with your local PostgreSQL instance
3. Run migrations with `npx drizzle-kit push`

## API

### POST `/api/invoices`
Accepts a JSON payload strictly validated via Zod. Unexpected fields like `tenantId` are actively rejected. Returns 201 on success, 400 on validation failure, or 409 on duplicate invoice.

### GET `/api/invoices`
Returns all invoices assigned to the currently authenticated session's `tenantId`.

## Authentication
Simulated using simple signed JWT cookies containing `{ userId, tenantId }`.

## Tenant Isolation
The single most important security rule implemented: **tenantId NEVER comes from user input**. 
Every single database write explicitly extracts `tenantId` from `await getSession()`. Every database read queries with `.where(eq(invoices.tenantId, session.tenantId))`. It is impossible for a user to spoof their tenant by sending it in the request body.

## Money Handling
Invoice values are sent as precision strings (e.g., `"0.30"`) and safely multiplied into integer cents before mathematical validation to avoid JavaScript floating point `0.1 + 0.2 === 0.30000000000000004` errors.

## Duplicate Protection
PostgreSQL actively enforces `UNIQUE (tenant_id, vendor_code, invoice_number)`. When catching error `23505`, the server returns a 409 Conflict. Duplicate checks scale safely across multiple concurrent API requests without race conditions.

## Testing
`npm run test` executes four Vitest scenarios verifying:
1. Tenant Isolation during reads.
2. Prevention of Body Tenant ID attack.
3. Floating point mathematical safety.
4. Duplicate API logic.

## Security Decisions
The tenant ID is never trusted from client input. Every invoice write uses `tenantId` from the verified session. Every invoice read filters by the session's `tenantId` strictly at the DB query level, not filtered dynamically on the frontend. The `z.object().strict()` actively rejects rogue parameters.

## What I did not finish or am unsure about
- Production Authentication implementation: Real JWT refresh loops or NextAuth implementations were skipped per the prompt to focus on the simulated multi-tenant isolation.
- Detailed Frontend Form handling: The frontend is purely functional and simplistic without extensive loading spinners or react-hook-form complexity to save time.

## AI Usage
This project was built collaboratively with AI assistance. I drove the architectural decisions (such as the database-level tenant isolation, unique constraints, and safe money math), while utilizing AI tools as a pair-programming partner to scaffold Next.js boilerplate, generate Zod schemas, and rapidly scaffold unit tests based on my defined criteria.

Co-Authored-By: AI Assistant <ai@google.com>
