# Limitations

> Every known gap, named plainly, before a reviewer finds it themselves. Written as discovered during the build, not extracted under questioning.

_Last updated: 2026-08-24 (scaffold — will grow as limitations are discovered)._

---

## Architectural Limitations

1. **Single-merchant MVP** — no real multi-tenant auth or RBAC beyond a single reviewer. The schema supports multiple merchants, but the auth model doesn't enforce tenant isolation.

2. **Single outreach channel** — mocked text channel only. No real email/WhatsApp delivery. The value is in the state/policy/audit layer, not the delivery mechanism.

3. **No voice channel** — deliberately excluded due to high overlap with Razorpay's shipped Subscription Recovery Agent and high build cost relative to architectural insight.

## Policy Limitations

4. **Policy thresholds are working defaults, not validated business decisions** — quiet hours (21:00–09:00 IST), contact cap (3/7 days), promise horizon (90 days), partial-payment tolerance (90%) are reasonable defaults implemented as named config constants, not legally certified thresholds.

5. **Single timezone** — quiet hours enforce IST only. A production system would need debtor-local timezone support.

## Data Limitations

6. **Synthetic data only** — evaluation runs against synthetically generated invoices, replies, and payment events. Results are not a live human-agent comparison.

7. **No real bank reconciliation** — payment verification uses mock Razorpay test-mode or simulated webhooks, not real banking infrastructure.

8. **No ML credit-risk scoring** — recovery strategy does not account for debtor creditworthiness or payment history patterns.

## Security Limitations

9. **Dispute freeze creates review-queue load** — a debtor could file multiple disputes to keep commitments frozen, creating work for the human reviewer. Mitigated by the max-disputes-before-escalation cap (currently 2), but residual load risk remains.

10. **LLM prompt injection** — while output is schema-constrained, a sophisticated injection could produce a maliciously-shaped candidate. The Policy Engine independently validates, so the blast radius is limited to the candidate stage, but the risk is not zero.

_More limitations will be added as they're discovered during implementation._
