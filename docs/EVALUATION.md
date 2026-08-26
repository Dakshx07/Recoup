# Recoup — Evaluation Methodology & Empirical Benchmark Results

This document describes the synthetic evaluation methodology, scenario distributions, and empirical performance metrics for the 200-case enterprise dataset derived directly from Supabase PostgreSQL.

---

## 1. Evaluation Methodology

To evaluate Recoup without exposing sensitive merchant debtor data, we constructed a **200-case synthetic enterprise benchmark** representing **₹1,24,77,150.00** in total overdue receivables across 8 realistic behavioral scenarios (`03_IMPLEMENTATION_PLAN.md` §2).

### Evaluation Discipline:
- **Zero Hallucinated Floors:** All metrics are calculated by [`src/lib/evaluation/benchmark.ts`](../src/lib/evaluation/benchmark.ts) directly from PostgreSQL table rows.
- **Deterministic State Isolation:** Domain transitions are governed strictly by the deterministic Policy Engine. The LLM has zero SQL write permissions.

---

## 2. Scenario Distribution (200 Invoices / ₹1,24,77,150 Book)

| Scenario Type | Cases | Total Invoiced | Capital Recovered | Recovery Rate | Policy & Outcome Behavior |
|---|:---:|---:|---:|:---:|---|
| `CLEAN_PROMISE` | 60 (30%) | ₹37,25,350 | ₹37,25,350 | 100.0% | Promises full payment within 7–14 days; settles on schedule (`CLOSED_PAID`) |
| `BROKEN_PROMISE` | 30 (15%) | ₹19,44,700 | ₹0 | 0.0% | Defaults on due date &rarr; triggers escalation ladder to collections (`ESCALATED`) |
| `PROMISE_THEN_DISPUTE` | 20 (10%) | ₹11,88,050 | ₹0 | 0.0% | Debtor raises dispute &rarr; active promise **frozen** (`is_frozen = true`), moved to `DISPUTE_OPEN` |
| `DIRECT_DISPUTE` | 20 (10%) | ₹11,78,400 | ₹0 | 0.0% | Immediate billing dispute without prior promise &rarr; routed to human review (`DISPUTE_OPEN`) |
| `GHOST` | 30 (15%) | ₹19,62,850 | ₹0 | 0.0% | Zero response across contact cap &rarr; day 14 collections handoff (`ESCALATED`) |
| `AMBIGUOUS` | 20 (10%) | ₹11,97,100 | ₹0 | 0.0% | Vague natural language reply &rarr; flagged for clarification (`AWAITING_REPLY`) |
| `PARTIAL_PAYMENT` | 10 (5%) | ₹6,89,450 | ₹6,89,377 | 100.0% | Settles &ge; 90% tolerance &rarr; marked partial closure (`CLOSED_PARTIAL`) |
| `UNPROMPTED_PAYMENT` | 10 (5%) | ₹5,91,250 | ₹5,91,250 | 100.0% | Direct settlement via payment link &rarr; auto-reconciles (`CLOSED_PAID`) |
| **TOTAL** | **200 (100%)** | **₹1,24,77,150** | **₹50,05,977** | **40.12%** | **80 Settled / 120 Active or Escalated** |

---

## 3. Empirical Benchmark Results (Measured from Database)

| Category | Metric | Measured Value | Verification Source | Status |
|---|---|:---:|---|:---:|
| **Capital Recovery** | **Total Invoiced Book** | **₹1,24,77,150.00** | $\sum \text{invoices.original\_amount}$ ($N = 200$) | `MEASURED` |
| | **Capital Recovered** | **₹50,05,977.00** | $\sum(\text{original\_amount} - \text{outstanding\_amount})$ | `MEASURED` |
| | **Capital Outstanding** | **₹74,71,173.00** | $\sum \text{invoices.outstanding\_amount}$ | `MEASURED` |
| | **Portfolio Recovery Rate** | **40.12%** | $₹50,05,977 / ₹1,24,77,150$ | `MEASURED` |
| | **Case Settlement Rate** | **40.0%** | 80 of 200 cases settled | `MEASURED` |
| **Commitment Ledger** | **Clean Promise Honor Rate** | **100.0%** | 60 of 60 clean promises settled in full | `MEASURED` |
| | **Resolved Promise Honor Rate** | **70.0%** | 70 of 100 resolved promises kept/partial | `MEASURED` |
| **Policy Safety** | **Dispute-Freeze Adherence** | **100.0%** | 18 active promises frozen, 0 wrongfully cancelled | `MEASURED` |
| | **Human Dispute Review Queue** | **20.0%** | 40 cases held in `DISPUTE_OPEN` | `MEASURED` |
| **LLM Governance** | **Strict Schema Validity** | **100.0%** | 180 of 180 parses conform to Zod schema | `MEASURED` |
| | **Mean Parse Confidence** | **92.0%** | Mean confidence across Gemini 2.0 Flash calls | `MEASURED` |
| | **Zero Direct DB Write Privileges** | **0 Perms** | Enforced via PostgreSQL RLS & Service Role | `ENFORCED` |

---

## 4. Distinction Between Measured Metrics and Baseline Assumptions

- **Measured Ground Truth:** All figures listed in Section 3 are calculated from raw PostgreSQL rows in the 200-case portfolio.
- **Modeled Baseline Comparisons:** Any comparison against static 3-touch reminder bots represents an **assumed simulation model**, not a physical measurement from a live production control group.
- **Classification Accuracy Distinction:** Model extraction confidence (mean 92.0%) represents model output probability and is strictly distinguished from semantic classification accuracy against ground-truth labels.
