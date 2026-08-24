# ADR 0007: RLS Lockdown and Service-Role-Only Writes

> Status: **Accepted** — 2026-08-24, build-order step 2.

## Context

Supabase's PostgREST auto-generates a REST API over every table. This is convenient for rapid development but creates a structural security risk: **without explicit Row Level Security (RLS), any authenticated browser client can write directly to state-bearing tables** — bypassing the state-transition service that is supposed to be the only write path.

This isn't a theoretical concern. If a reviewer (or an attacker who compromises a reviewer session) can POST directly to the `recovery_cases` table via the PostgREST API, they can:
- Set `state` to any value, skipping policy validation
- Create commitments without promise-validity checks
- Insert audit events with fabricated data
- Bypass quiet hours, contact caps, and all other guardrails

## Decision

1. **RLS enabled on every table** — not just state-bearing ones (defense in depth)
2. **No INSERT/UPDATE/DELETE policies** defined for `anon` or `authenticated` roles on any table
3. **SELECT-only policies** for `authenticated` role, scoped to reviewer-facing tables
4. **All writes** happen via the backend's **service-role** Supabase client (`infra/supabase-server-client.ts`), which bypasses RLS by design
5. **Service-role key** is a server-side environment variable, never shipped to the browser

This makes the state-transition service the only write path **in practice** (not just in intention).

## Consequences

**Positive:**
- PostgREST bypass risk is fully mitigated — no browser-initiated writes possible
- The state-transition service is the genuine sole write path, enforced by infrastructure
- Defense in depth: even if application code has a bug, the DB rejects unauthorized writes
- Reviewer dashboard can safely use Supabase's client-side SDK for reads

**Negative:**
- Every write operation must go through the backend API → adds latency vs. direct PostgREST writes
- Service-role key is a high-value secret — if leaked, it bypasses all RLS
- Dashboard features that need writes (human override) require dedicated API routes, not direct table mutations

**Mitigations for negatives:**
- Latency is acceptable at MVP scale (~200 invoices)
- Service-role key handling: env-var only, server-side only, `.env.example` documents it
- API routes for writes are built anyway (they route through the state-transition service)
