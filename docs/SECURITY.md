# Security

> RLS policies, auth model, secrets handling, and threat/mitigation matrix.

_Last updated: 2026-08-24 (scaffold — RLS details to be filled at build-order step 2)._

---

## Auth Model

- **Supabase Auth** — single reviewer identity
- **Service-role key** — server-side only, bypasses RLS, used exclusively by the state-transition service
- **Anon key** — browser-side, read-only dashboard queries via RLS-scoped SELECT policies

## RLS Policies

_To be documented at step 2._

## Secrets Handling

- All secrets via environment variables, never committed
- Service-role key is server-side only (never imported in client-side code)
- `.env.example` documents required variables without values

## Threat/Mitigation Matrix

| Risk | Mitigation |
|---|---|
| Duplicate webhooks | Unique DB constraint on external id; safe no-op |
| LLM hallucination | Schema validation + confidence threshold; low-confidence → ambiguous |
| Prompt injection | Strictly typed output schema; injection can only produce a candidate, validated by Policy Engine |
| Unauthorized state changes | RLS default-deny + service-role-only writes |
| Race conditions | Per-case row lock (SELECT...FOR UPDATE) |
| Policy bypass | Guardrail checks in single state-transition path |
| Secret exposure | Env vars only, service-role key server-side only |
