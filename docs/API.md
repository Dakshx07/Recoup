# Recoup — API Reference

This document provides the endpoint reference, request/response schemas, error codes, and concurrency behavior for all Recoup API routes.

---

## 1. Endpoints Overview

| Endpoint | Method | Purpose | Auth Required | Idempotency / Concurrency |
|---|---|---|---|---|
| `/api/cases` | GET | Fetch case queue (filterable by tab & state) | Read (Supabase Auth) | Safe read |
| `/api/cases/[id]` | GET | Fetch full case detail, commitments, audit trail | Read (Supabase Auth) | Safe read |
| `/api/cases/[id]/override` | POST | Apply human override (dispute determination, escalation, write-off) | Reviewer Auth | Optimistic Concurrency Precondition (`409 Conflict`) |
| `/api/audit` | GET | Fetch paginated system audit log with actor/event filters | Read (Supabase Auth) | Safe read |
| `/api/evaluation` | GET | Calculate live recovery metrics and model activity | Read (Supabase Auth) | Safe read |
| `/api/simulation/advance` | POST | Advance simulated clock by N days and trigger cron evaluations | Admin / Reviewer | Optimistic clock advancement |

---

## 2. Endpoint Details

### `POST /api/cases/[id]/override`
Executes a human reviewer determination on a recovery case.

#### Request Headers:
```http
Content-Type: application/json
```

#### Request Body:
```json
{
  "action": "reject_dispute",
  "justification": "Verified debtor invoice claims. Resuming commitment.",
  "expectedState": "DISPUTE_OPEN"
}
```

#### Supported Actions:
- **`reject_dispute`**: Unfreezes active commitment (`is_frozen = false`), transitions case from `DISPUTE_OPEN` &rarr; `COMMITMENT_ACTIVE`.
- **`uphold_dispute`**: Voids commitment (`status = VOIDED_BY_DISPUTE`, `is_frozen = false`), transitions case from `DISPUTE_OPEN` &rarr; `AWAITING_REPLY`.
- **`escalate`**: Force escalates case to `ESCALATED`.
- **`write_off`**: Transitions case to terminal `CLOSED_WRITTEN_OFF`.

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "previousState": "DISPUTE_OPEN",
  "newState": "COMMITMENT_ACTIVE"
}
```

#### Concurrency Conflict Response (`409 Conflict`):
Returned when `expectedState` does not match the live database state or another concurrent request won the race:
```json
{
  "error": "Conflict: Case state has changed concurrently. Please refresh the page."
}
```

#### Validation Error Response (`400 Bad Request`):
```json
{
  "error": "Justification is required for all override actions"
}
```

---

### `POST /api/simulation/advance`
Advances the authoritative simulated clock by $N$ days and runs all due checks.

#### Request Body:
```json
{
  "days": 3
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "currentDate": "2026-01-08T09:00:00.000Z",
  "advancedDays": 3,
  "logs": [
    "Evaluated 60 active cases against clock Jan 8, 2026",
    "Processed 2 promise due date reconciliations"
  ]
}
```

---

### `GET /api/evaluation`
Computes live empirical benchmark recovery metrics across the 200-case dataset directly from PostgreSQL.

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "measured": true,
  "metrics": {
    "totalInvoiced": 12477150,
    "totalRecovered": 5005977,
    "totalOutstanding": 7471173,
    "recoveryRate": 40.12,
    "totalCases": 200,
    "settledCases": 80,
    "settlementRate": 40.0,
    "resolvedPromiseHonorRate": 70.0,
    "cleanPromiseHonorRate": 100.0,
    "disputeFreezeAdherenceRate": 100.0,
    "disputeCasesCount": 40,
    "activeFrozenCommitmentsCount": 18,
    "schemaValidityRate": 100.0,
    "meanConfidence": 0.9195,
    "hallucinationRate": 0.0
  },
  "scenarios": [
    {
      "key": "CLEAN_PROMISE",
      "name": "Clean promise, kept on time",
      "count": 60,
      "share": "30%",
      "totalInvoiced": 3725350,
      "totalRecovered": 3725350,
      "totalOutstanding": 0,
      "recoveryRate": 100.0,
      "statusSummary": "60/60 Settled Full (100.0%)"
    }
  ]
}
```
