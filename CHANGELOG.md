# Changelog

All notable changes to Recoup are documented here. Entries are added per completed build-order item, not written retrospectively.

---

## [0.3.0] — 2026-08-24

### Added — Build-Order Steps 5–6
- **[05] State machine types** — `RecoveryCaseState` (10 states), `CommitmentStatus` (8 statuses), valid transition maps, terminal state sets, transition validation functions
- **[06] Policy Engine core rules** — all 6 rule modules with named config constants:
  - `promise-validity.ts` — amount/date/horizon/renegotiation validation
  - `quiet-hours.ts` — 21:00–09:00 IST block with timezone-aware calculation
  - `contact-frequency.ts` — rolling 7-day window, max 3 per case
  - `dispute-freeze.ts` — the required edge case (freeze, never cancel/ignore)
  - `escalation-ladder.ts` — time-based + broken-promise triggers
  - `stopping-rules.ts` — full payment, max attempts, terminal escalation, legal hold
- **166 unit tests** across 8 test files — all passing
- ADRs 0001, 0002, 0006 written

## [0.2.0] — 2026-08-24

### Added — Build-Order Steps 1–3
- **[01] Schema migration** — all 12 tables with CHECK constraints, foreign keys
- **[02] RLS policies** — default-deny writes, SELECT-only for reviewer, service-role-only writes
- **[03] Clock abstraction** — `Clock` interface, `LiveClock`, `SimulatedClock` with advance methods
- Constraints and indexes migration — unique indexes for idempotency, partial unique indexes for invariants
- Terminal-state trigger on commitments
- ADRs 0003, 0005, 0007 written

## [0.1.0] — 2026-08-24

### Added — Build-Order Step 0
- **[00] Project scaffold** — `CONVENTIONS.md`, `README.md`, `.env.example`, full `docs/` structure
- Next.js project with TypeScript strict mode, Tailwind CSS
- CI workflow (typecheck + unit tests on every push)
- All documentation stubs per `04_REPOSITORY_STRUCTURE.md` §2
- `BUILD_TRACKER.md` and `EXPLAINER.md` for tracking and understanding
