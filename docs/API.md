# API Reference

> Endpoint reference — request/response shapes, auth requirements, idempotency notes.

_Last updated: 2026-08-24 (scaffold — will be filled as endpoints are built)._

---

## Endpoints

| Endpoint | Method | Purpose | Auth | Idempotency | Status |
|---|---|---|---|---|---|
| `/api/webhooks/razorpay-payment` | POST | Ingest payment webhook | Signature-verified | `external_payment_id` unique | Pending (step 9) |
| `/api/webhooks/debtor-reply` | POST | Ingest inbound reply | Signature/shared-secret | `external_message_id` unique | Pending (step 8) |
| `/api/recovery-cases/{id}/advance-clock` | POST | DEMO — advance time, run due checks | Supabase Auth | Idempotent by construction | Pending (step 11) |
| `/api/recovery-cases/{id}` | GET | Full case detail | Supabase Auth | read-only | Pending (step 13) |
| `/api/recovery-cases` | GET | Queue, filterable | Supabase Auth | read-only | Pending (step 13) |
| `/api/recovery-cases/{id}/human-override` | POST | Resolve dispute/escalate/stop/extend | Supabase Auth | Client request id recommended | Pending (step 13) |
| `/api/eval/run` | GET | Compute metrics | Supabase Auth | read-only | Pending (step 12) |
| `/api/synthetic/generate-batch` | POST | Generate synthetic batch | Supabase Auth, non-prod | n/a | Pending (step 4) |

_Request/response shapes to be documented as each endpoint is implemented._
