# Evaluation

> Methodology, the 70/30 split discipline, metrics, and results.

_Last updated: 2026-08-24 (scaffold — will be filled at build-order step 12)._

---

## Methodology

_To be documented when evaluation harness is built._

## Synthetic Dataset

- **Batch size:** 200 invoices
- **Split:** 70% tuning / 30% held-out (frozen before iteration begins)

## Scenario Distribution

| Scenario | Share |
|---|---|
| Clean promise, kept on time | 30% |
| Broken promise, no dispute | 15% |
| Promise then dispute (edge case) | 10% |
| Direct dispute, no promise | 10% |
| Ghost (no reply) | 15% |
| Ambiguous/vague reply | 10% |
| Partial payment | 5% |
| Unprompted direct payment | 5% |

## Metrics

_Actual results to be filled after evaluation harness runs._

## Baseline Comparison

_To be added._
