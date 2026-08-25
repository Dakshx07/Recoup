# Changelog

All notable changes to the Recoup platform are documented here.

---

## [1.0.0] — 2026-08-25 (Submission Release)

### Final Hardening & Submission Verification
- **Human Override Concurrency**: Injected atomic optimistic state locking (`.eq('state', caseData.state)`) on `/api/cases/[id]/override` with `409 Conflict` rejections.
- **Double-Submit Protection**: Verified that rapid duplicate clicks produce exactly one state transition, one commitment mutation, and one immutable audit event.
- **Dual-Timestamp Engine**: Scoped simulated relative time calculations strictly to case-level business clocks while preserving real UTC wall-clock audit timestamps.
- **Operations Console**: Built Blade-styled Recovery Dashboard with 4-metric strip, Needs Attention queue, and case detail pages.
- **Evaluation Benchmark**: Completed 200-case synthetic evaluation suite showing **68.4%** autonomous recovery vs **42.0%** static baseline (**+26.4-point lift**).
- **Automated Test Suite**: 166 Vitest unit/policy tests passing with 0 TypeScript compilation errors.

---

## [0.3.0] — 2026-08-24

### Domain Model & Policy Engine
- **State Machine Topology**: `RecoveryCaseState` (10 states) and `CommitmentStatus` (8 statuses) with strict transition maps.
- **Policy Engine Rules**: 13 locked business constants in `config.ts` covering Quiet Hours (21:00–09:00 IST), 3-touch frequency caps, 90-day horizon limits, and Dispute-Freeze rules.
- **Zero-Tool LLM Integration**: Gemini 2.0 Flash parser with strict Zod JSON schema validation and zero direct database write permissions.

---

## [0.2.0] — 2026-08-24

### Database Schema & Security
- **PostgreSQL 15 Migration**: 12 core tables with foreign keys, CHECK constraints, and partial unique indexes.
- **Row Level Security (RLS)**: Default-deny write policies on all state tables with service-role server writes.
- **Clock Abstraction**: Pluggable `Clock` interface supporting `LIVE` wall-clock and `DEMO` simulated time.

---

## [0.1.0] — 2026-08-24

### Initial Scaffold
- Next.js 15 App Router scaffold with TypeScript strict mode and Tailwind CSS.
- Core repository structure and initial Architecture Decision Records (ADRs 0001–0007).
