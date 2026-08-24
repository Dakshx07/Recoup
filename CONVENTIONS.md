# Recoup — Conventions

This file is the single source of truth for naming, style, and commit discipline. Every contributor (human or AI) follows these rules. Created before any application code, so all sessions stay consistent.

---

## 1. TypeScript

- **Strict mode only** — `strict: true` in `tsconfig.json`, no exceptions.
- **No `any`** except at a well-justified, commented external-API boundary (e.g., Razorpay webhook payload before validation). Every `any` must have a `// EXTERNAL_BOUNDARY: <reason>` comment.
- **Prefer `unknown` over `any`** for untrusted input; narrow with type guards.
- **Enums via `as const` objects**, not TypeScript `enum` — they're tree-shakable and play nicely with Zod schemas.
- **Explicit return types** on all exported functions.
- **No default exports** except where Next.js requires them (pages, route handlers).

## 2. File naming

- **kebab-case** for all files: `state-transition.service.ts`, `promise-validity.ts`.
- **`.ts` for pure logic**, `.tsx` only when JSX is present.
- **Test files** mirror source path: `src/domain/policy-engine/promise-validity.ts` → `tests/unit/policy-engine/promise-validity.test.ts`.
- **Barrel exports** (`index.ts`) only at module boundaries (`domain/clock/index.ts`), never deep nesting.

## 3. Directory structure

- **`src/domain/`** — pure business logic, framework-agnostic, unit-testable without a database or network call. Inject dependencies (including `Clock`), don't reach for globals.
- **`src/services/`** — orchestration layer. The **only** write path to `recovery_cases.state` and `commitments.status`.
- **`src/infra/`** — external integrations (Supabase clients, Razorpay, LLM provider). Thin wrappers, no business logic.
- **`src/app/`** — Next.js app router. API routes delegate to services; pages consume read-only data.
- **`src/components/`** — React components for the dashboard.

## 4. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Types/Interfaces | PascalCase | `RecoveryCaseState`, `Commitment` |
| Constants (config) | UPPER_SNAKE_CASE | `MAX_PROMISE_HORIZON_DAYS`, `QUIET_HOURS_START` |
| Functions | camelCase | `validatePromise`, `isWithinQuietHours` |
| Files | kebab-case | `escalation-ladder.ts` |
| DB columns | snake_case | `recovery_case_id`, `promised_amount` |
| Enums (as const) | PascalCase object, UPPER_SNAKE_CASE values | `RecoveryCaseState.OPEN` |

## 5. Comments

- **Comments explain *why*, not *what*** — the code says what; the comment says why this approach over an obvious alternative.
- **Especially required in:** `policy-engine/` (why this threshold), `state-transition.service.ts` (why this ordering), and any concurrency-sensitive code.
- **TODO format:** `// TODO(build-order-#): description` — so TODOs are traceable to the build step.

## 6. Commit messages

- **Format:** `[build-order-#] short imperative description`
- **Examples:**
  - `[00] scaffold project structure and conventions`
  - `[01] add full schema migration — all 12 tables`
  - `[02] apply RLS policies — default-deny writes for anon/authenticated`
  - `[06] add promise-validity rule with unit tests`
- **Rule:** No commit that changes `domain/policy-engine/` may land without an accompanying test in `tests/unit/policy-engine/`.
- **Rule:** Every MUST-BUILD completion gets a `CHANGELOG.md` entry.

## 7. Dependency injection

- Business logic in `domain/` accepts dependencies as constructor/function parameters.
- The `Clock` interface is always injected, never imported as a singleton.
- Database access is via repository functions passed in, never via direct Supabase client imports in domain code.

## 8. Error handling

- **Domain functions** return `Result<T, E>` pattern (discriminated union) — never throw for expected business failures.
- **Infrastructure errors** (network, DB) may throw; caught at the service layer.
- **API routes** return structured JSON errors with appropriate HTTP status codes.

## 9. Testing

- **Unit tests** use Vitest (fast, TypeScript-native, ESM-compatible).
- **No database or network** in unit tests — mock/stub all I/O boundaries.
- **Test file naming:** `*.test.ts`, co-located test mirrors in `tests/unit/`.
- **Every policy engine rule** gets a test before moving to the next build-order item.

## 10. Config constants

- **Every threshold** in the Policy Engine is a named constant in `domain/policy-engine/config.ts`.
- **Never hardcode** a number inline in a rule file.
- **Config constants** are plain TypeScript (not env vars) — they're business rules, not deployment config.
- **Env vars** are for secrets and infrastructure (Supabase keys, API keys, URLs).
