# ADR 0005: Simulated Clock Abstraction

> Status: **Accepted** — 2026-08-24, build-order step 3.

## Context

Recovery cases play out over days to weeks: initial outreach → wait for reply → monitor commitment → check on due date → escalate after timeouts. A 14-day escalation ladder cannot be demonstrated, tested, or evaluated in real time.

The standard approaches are:
1. **Mock `Date.now()` in tests only** — test-time-only solution; the demo still runs in real time
2. **Time-compression factor** (e.g., 1 second = 1 day) — fragile, non-deterministic, impossible to pause/step
3. **Injected Clock interface** — single abstraction used everywhere; LIVE returns real time, DEMO returns an advanceable value

## Decision

**Single injected `Clock` interface** (`clock.now()`) used everywhere time matters.

- `LIVE` mode: delegates to `new Date()` — real wall-clock time
- `DEMO` mode: explicit advanceable value, with `advance()` returning the previous time for interval processing

Same production code path runs in both modes. No `if (isDemo)` branches anywhere in business logic.

When the clock advances in DEMO mode, all due-date checks between the old and new simulated time run in strict chronological order — the advance-clock API endpoint triggers this processing.

Every `audit_events` row carries both `simulated_time` (what the system thought the time was) and `real_wall_clock_time` (when the row was actually inserted). These are never conflated.

## Consequences

**Positive:**
- Demo can walk through a full 14-day lifecycle in seconds
- Evaluation harness runs deterministically — same input, same time sequence, same output
- No "demo-only" code paths — what you demo is what would run in production
- Dual timestamps on audit events preserve both business timeline and debug timeline
- Clock is injected, not global — every function that needs time declares it as a dependency

**Negative:**
- Every function that needs time requires a `Clock` parameter — slightly more verbose than `Date.now()`
- `advance()` must trigger cascading checks (due dates, timeouts) — the advance-clock endpoint must be careful about ordering
- Time-zone handling still requires care (quiet hours are IST-based)
