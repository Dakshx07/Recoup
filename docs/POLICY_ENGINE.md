# Recoup — Policy Engine Reference

The Recoup Policy Engine is the sole authority for evaluating promise validity, enforcement cadence, quiet hours, and escalation rules. It is completely deterministic and implemented in pure TypeScript.

---

## 1. The 13 Locked Business Constants

All thresholds live in [`src/domain/policy-engine/config.ts`](../src/domain/policy-engine/config.ts) and are verified by 166 automated unit tests.

| Constant Name | Value | Description |
|---|---|---|
| `MAX_PROMISE_HORIZON_DAYS` | `90` | Maximum allowable days in the future for a valid promise to pay |
| `MIN_PROMISE_AMOUNT_RATIO` | `0.10` | Promise must be at least 10% of total outstanding invoice balance |
| `PARTIAL_PAYMENT_TOLERANCE` | `0.90` | Payment &ge; 90% transitions commitment to `PARTIALLY_KEPT` |
| `MAX_OUTREACH_PER_WEEK` | `3` | Maximum contact touches allowed per rolling 7 days |
| `QUIET_HOURS_START_IST` | `21:00` | Evening quiet hours start (9:00 PM IST) — no outreach allowed |
| `QUIET_HOURS_END_IST` | `09:00` | Morning quiet hours end (9:00 AM IST) — outreach resumes |
| `ESCALATION_REMINDER_DAYS` | `3` | First gentle reminder interval after initial invoice default |
| `ESCALATION_FIRM_DAYS` | `7` | Firm follow-up interval before escalation |
| `ESCALATION_FINAL_DAYS` | `14` | Final warning interval before human review handoff |
| `MAX_TOTAL_OUTREACH_ATTEMPTS` | `5` | Absolute maximum outreach attempts before case becomes `GHOSTED` |
| `DISPUTE_FREEZE_ENABLED` | `true` | When `true`, disputes freeze active commitments rather than voiding |
| `CONFIDENCE_THRESHOLD` | `0.80` | Minimum LLM parser confidence; below 0.80 flags `AMBIGUOUS` |
| `MAX_RENEGOTIATION_ATTEMPTS` | `2` | Maximum allowable renegotiations on a single recovery case |

---

## 2. Policy Rule Breakdown

### A. Promise Validity Rule (`src/domain/policy-engine/promise-validity.ts`)
Validates whether an extracted debtor promise can become an active commitment:
1. `promised_amount > 0`
2. `promised_amount <= outstanding_amount`
3. `promised_date > current_simulated_date`
4. `promised_date <= current_simulated_date + 90 days`

### B. Quiet Hours Enforcement (`src/domain/policy-engine/quiet-hours.ts`)
Converts simulated time to Indian Standard Time (IST / UTC+5:30) and evaluates whether current hour is within 21:00 to 09:00 IST. If active, outreach dispatch is held in queue until 09:00 IST.

### C. Contact Frequency Cap (`src/domain/policy-engine/contact-frequency.ts`)
Queries `outreach_messages` for the specific case over the preceding 7 simulated days. If &ge; 3 touches exist, returns `DENIED_FREQUENCY_CAP`.

### D. Dispute-Freeze Rule (`src/domain/policy-engine/dispute-freeze.ts`)
When an inbound message is parsed with `intent_type = 'DISPUTE_CANDIDATE'`:
1. If an active commitment exists (`status = VALID_ACTIVE`):
   - Sets `is_frozen = true`.
   - Leaves `status = VALID_ACTIVE` (preserves legal evidence).
   - Preserves `promised_date` unchanged.
2. Transitions case to `DISPUTE_OPEN`.
3. Blocks further automated outreach until a human reviewer renders an override decision.
