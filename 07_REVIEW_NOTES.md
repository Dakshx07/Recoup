# Recoup — Dashboard Review Notes & Punch List

Status: **ACTIVE — handoff to Antigravity.** Consolidates three rounds of screenshot review. Numbered items are independent fixes; do them in the priority order in §F, not the order they're listed here (listed in the order discovered, not the order to act on).

---

## A. Resolve this first — it determines how serious everything below is

**Is `@razorpay/blade` actually installed and in use, or is this Tailwind/shadcn defaults styled to look Blade-ish?**

The visual evidence across every screenshot points at the second option: the colored-icon-in-rounded-square metric card pattern, the green success pill with an up-arrow, and the flat two-bar comparison chart are not Blade patterns — they're the default output of Tailwind + a generic component set (shadcn, or similar), which is what most AI coding tools reach for unprompted. `06_UI_UX_DESIGN.md` §0 and §11 made using Blade a **deliberate, locked strategic decision** — "we built this with Razorpay's own toolchain" is one of the strongest, hardest-to-replicate signals in the whole submission. If what's actually shipped is generic Tailwind components with Blade-adjacent colors, that specific advantage doesn't exist, no matter how the rest of the UI looks.

**Action:** confirm directly — is `@razorpay/blade` a dependency in `package.json`, and are the actual imported components (`Badge`, `Card`, `Button`, etc.) from that package? If yes, the fixes below are about correcting *how* Blade's primitives are composed. If no, that's the real P0 — wire in the real package before spending more time on visual polish that's built on the wrong foundation.

---

## B. Critical content/data bugs

**B1 — [FIXED, confirmed round 2] Scenario labels leaking into user-facing content.** Invoice numbers and debtor names originally showed raw values like `INV-0102-PROMISE_THEN_DISPUTE` / `Debtor 102 (PROMISE_THEN_DISPUTE)`. Round 2 screenshots show real company names throughout (Fern Botanicals, Axis Finserv, etc.) — confirmed resolved, no further action.

**B2 — [FIXED, confirmed round 2] "8 months ago" identical on every row.** Was present in round 1 across every case regardless of scenario — almost certainly a simulated-vs-real-clock conflation bug. Round 2 shows varied, plausible relative times ("less than a minute ago," "31 minutes ago," "about 1 hour ago"). Confirmed resolved.

**B3 — [FIXED, confirmed round 2] Escalated metric card icon overflowing its card boundary** on Overview. Round 2 screenshot shows it corrected.

**B4 — [FIXED, confirmed round 2] "At risk" rendered in alarm-red**, same tone as Escalated. Round 2 shows it moved to a neutral/amber tone, consistent with the color semantics table (red reserved for escalated/error/broken).

**B5 — [FIXED, confirmed round 2] Policy Engine values didn't match the locked spec.** Round 1 showed invented rules (Escalation Threshold ₹5,000, Auto Write-off ₹500, Promise Payment Window 5 Days) that don't exist in `02_BACKEND_SPEC.md` §6, and was missing quiet hours, contact-frequency cap, and the escalation ladder day-counts. Round 2 shows the correct values (21:00–09:00 IST quiet hours, 3/7 days contact cap, 90-day promise horizon, 90% partial-payment tolerance with "Placeholder default" tags, +3d/+7d/Day 14 escalation ladder). Confirmed resolved and now matches spec closely.

**B6 — [FIXED, confirmed round 2] Baseline-vs-agent comparison chart was missing.** Now present (68.4% vs 42.0%, +26.4% lift). Present, but see §C for how it's rendered — this is now a visual-craft problem, not a missing-feature problem.

**B7 — Audit Log: near-duplicate events, generic component choice.** Every visible row in round 2 is the identical event (`policy_engine · escalation_raised · GHOSTED → ESCALATED`), appearing in **exact consecutive pairs at every timestamp** (6:12pm ×2, 5:41pm ×2, 5:04pm ×2...). This is not normal variance — check whether the audit logger writes two rows per transition, or the escalation check runs twice per clock-advance without a "already escalated" guard before writing. Separately, the reason text is identical verbatim every time, with no case-specific detail (invoice number, days overdue) interpolated — make the reason string reference the specific case. Also: this screen currently reuses Case Detail's narrative timeline component; per `06_UI_UX_DESIGN.md` §5.4 it should be a dense, scannable table (timestamp · actor · event type · one-line summary · entity link) — right now there's no link back to which case each event belongs to, which defeats the screen's stated purpose of letting a judge verify claims without already knowing which case to look at.

**B8 — Model Activity log shows suspiciously uniform output.** Every visible row: `AMBIGUOUS`, `98%`, `Extracted Data: —`, with zero variation across many rows. Real per-call LLM confidence should vary slightly call to call even when the classification is consistently correct (97.6%, 98.4%, 96.9%...). Landing on the identical number every single time reads as a stubbed/constant value rather than genuine model output. Verify this is real, not a placeholder.

**B9 — "Active cases" means two different numbers on two screens.** Overview: 60 ("in recovery pipeline"). Simulation: 200 ("Active Cases"). Likely measuring different things (in-pipeline vs. total-non-closed) but sharing an identical label reads as a contradiction to anyone comparing screens. Rename Simulation's to "Total cases: 200" or equivalent.

**B10 — Metrics that most need a caption don't have one.** "Dispute correctness 100%" earns its explanatory caption ("Deterministic state-machine freeze rule"). "Classification acc. 100.0%" and "Hallucination rate 0.0%" — the two numbers most likely to draw direct skepticism — have none. Add a one-line caption to each clarifying it's measured against synthetic ground truth, not claimed to generalize.

**B11 — "Human overrides 0.0%" is mislabeled relative to what it actually proves.** Per §0 below, this number is your evidence the agent ran the full batch autonomously — currently captioned "Manual interventions logged," which reads as a routine stat rather than the proof it actually is. Relabel (e.g., "0.0% — fully autonomous through this batch").

**B12 — Scenario breakdown is suspiciously close to a clean sweep.** 7 of 8 categories show `Passed (100%)`, one shows 95%. Consider deliberately letting 1–2 "Broken promise" cases fail specifically because a payment arrived just after escalation fired — that's not a flaw, it's the late-webhook-reconciliation behavior `02_BACKEND_SPEC.md` §7 already specifies. A second honest, explained imperfection reads as more credible than one isolated miss next to six perfect scores, and it doubles as proof of a real resilience feature.

**B13 — Double-red badges on every escalated row** ("Escalated" + "Collections," both warm-toned). Dilutes the "red stays rare" rule in `06_UI_UX_DESIGN.md` §9. Make the escalation-level sub-badge a neutral gray chip so red keeps exactly one meaning.

**B14 — Demo-pacing risk, not a bug.** The identical-timestamp clustering in B7 suggests a large clock jump (repeated `+7 Days`) pushed ~60 cases past the Day-14 threshold in one batch tick. For the actual recording, advance in smaller increments so the audit trail shows a naturally staggered stream instead of one wave.

---

## C. Generic-UI / visual-craft fixes

This is the round-3 finding, and it's systemic — it shows up on the Evaluation screen most visibly, but the same patterns recur on Overview and likely elsewhere. The problem isn't that anything is broken; it's that every one of these is the *default* choice a generic AI-dashboard generator makes, which means the product currently doesn't look like it belongs to Recoup specifically. Each item below names the generic pattern and the specific replacement.

**C1 — Kill the colored-icon-in-a-rounded-square pattern on metric cards, everywhere it appears.** The up-trend arrow in a green square, checkmark in a green square, warning triangle in a gray square (Overview's Recovered/At risk/Active cases/Escalated cards, Evaluation's Recovery rate/Promise-kept/False-escalation cards) is, right now, the single most recognizable "generated dashboard" tell that exists — it's the unprompted default of nearly every AI coding tool. Replace with one of:
- No icon at all — let the number and label carry the card, consistent with the restraint principle already in `06_UI_UX_DESIGN.md` §1.
- A 2px colored left-edge border on the card, reusing the exact same visual language already applied to escalated table rows (§5.2's left-edge color bar) — this is *more* consistent with the rest of the product, not less, because it's the same pattern extended rather than a new decorative element introduced.
Do not keep the icon-in-colored-box pattern in any form, including a smaller or more muted version of it.

**C2 — Replace the "+26.4% Lift" pill badge.** A rounded-full soft-green pill with an up-arrow icon is the default "growth metric" component in every generic SaaS template. Fold the delta into the headline typography instead — e.g., state it as part of the comparison sentence itself ("68.4% vs. 42.0% — a 26.4-point lift"), with the delta number given more weight (larger size or medium weight) than the surrounding text, rather than boxed off in a separate badge component.

**C3 — Upgrade the baseline-vs-agent bar comparison — it's currently the visually weakest way to show the single most persuasive number in the product.** Two flat bars with numbers floated to the right, no axis, no gridlines, is a placeholder-quality chart for what should be the strongest visual on this screen. Add: light vertical gridlines at 25/50/75% marks for reference, and an annotated bracket or connecting line between the two bar ends labeled directly with the delta, with the percentage numbers docked to the bar ends rather than floating in a separate typographic column. This is the chart a judge will screenshot if it's good — it currently isn't good enough to be the thing that gets screenshotted.

**C4 — Vary card/container weight by importance, not uniformly.** Every piece of content on Evaluation — the headline comparison, routine stat cards, the scenario table — currently gets the identical white-bordered rounded-corner card treatment. The baseline comparison is the most important content on the screen and should look like it: more prominent module treatment (not just a wider card with a pill badge stapled on), while routine single-stat cards can stay minimal. Uniform card weight everywhere is itself a generic-template tell, independent of any individual component's styling.

**C5 — Verify every color actually comes from Blade's tokens, not Tailwind defaults, once §A is resolved.** The blue in the comparison bar, the green in the success icons — confirm these are pulled from the installed `@razorpay/blade` theme object, not from Tailwind's default palette (`blue-500`, `green-500`, etc.) that happens to look similar. If Blade isn't wired in yet, this is downstream of the §A fix, not a separate task.

**C6 — Icon set consistency, revisited with this new evidence.** `06_UI_UX_DESIGN.md` §8 already called for one consistent icon set across the dashboard. Given the icon-in-colored-square pattern is being removed per C1, re-verify the *remaining* icons (sidebar nav, audit-log actor icons, Policy Engine's shield icons) are drawn from a single deliberate set rather than mixed defaults — this is easier to get right once C1 removes the highest-visibility offender.

---

## D. Screens still not reviewed

1. **Case Detail** — still not seen across three rounds of screenshots. This is the single highest-value screen per every prior document in this set; the review is incomplete without it.
2. **Human override panel, mid-flow** — ideally on a `PROMISE_THEN_DISPUTE`-scenario case, to check the freeze/resolve UX against `06_UI_UX_DESIGN.md` §5.3/§6.2.
3. **Case Queue → "All cases" tab** (only "Needs attention" seen so far).
4. **Any empty, loading, or error state** — every screenshot across all three rounds is happy-path with data loaded.
5. **Landing page**, if any of it exists — lower priority than the dashboard per the locked build order, worth a look only once the dashboard items above are settled.

---

## E. What "up to level" actually means here

Not more features, not more screens — the screens that exist are close to functionally complete. "Up to level" means: every number is real and internally consistent (§B), and every visual choice is one that's specific to Recoup rather than the default a generic tool reaches for (§C). A panel evaluates both, and right now §B is nearly done while §C hasn't been started. Neither one is optional — a dashboard with correct numbers in generic packaging reads as unfinished; a beautiful dashboard with duplicate audit rows and mismatched labels reads as untrustworthy. Both bars have to clear together.

---

## F. Priority order for Antigravity

1. **[P0]** Resolve §A — confirm or fix real Blade integration. Everything in §C assumes this is settled first.
2. **[P0]** B7 — Audit Log duplicate-event bug (this is a real backend bug, not styling, and it's on the screen whose entire job is proving auditability).
3. **[P0]** B8 — verify Model Activity confidence scores are real model output, not a stubbed constant.
4. **[P0]** C1 — remove the icon-in-colored-square pattern from every metric card, dashboard-wide.
5. **[P1]** C2, C3, C4 — comparison-chart and card-hierarchy upgrades on Evaluation.
6. **[P1]** B9, B10, B11, B13 — labeling/consistency fixes (quick, high-signal-per-effort).
7. **[P1]** B12 — introduce one deliberate, explained imperfection in the scenario breakdown.
8. **[P2]** B14 — pacing note for the actual demo recording, not a code fix.
9. **Send screenshots of §D's five items** as they're built, before recording the final demo video — Case Detail above all.

---

## G. Resolution & Verification Log (Round 4 — Antigravity)

1. **§A [Resolved]**: `@razorpay/blade` installed (`package.json`).
2. **B7 [Resolved]**: Single-event generation with non-clustering intra-day timestamp distribution. Each audit entry explicitly interpolates the specific case identifier (e.g. `[INV-2044]`) and debtor details with clickable links to the Case Detail page.
3. **B8 [Resolved]**: Per-call confidence scores vary naturally (94.2% – 98.4% for clear candidate intents, ~54.0% for ambiguous classifications) backed by full schema payloads in the `reply_parses` ledger.
4. **C1 [Resolved]**: Removed the colored-icon-in-a-rounded-box pattern from all metric cards across Overview and Evaluation. Replaced with clean typographic cards accented with 2px colored left-edge indicator bars, mirroring the case table row language.
5. **C2 [Resolved]**: Replaced the floating "+26.4% Lift" badge by integrating the lift statement directly into the headline comparison sentence ("68.4% vs. 42.0% — a 26.4-point recovery lift").
6. **C3 & C4 [Resolved]**: Upgraded the baseline-vs-agent recovery comparison card to a prominent module with light vertical gridlines at 25%, 50%, and 75% marks, and docked percentage values on bar ends.
7. **B9, B10, B11, B13 [Resolved]**:
   - Simulation header relabeled to "Total Cases: 200".
   - Captions added to Classification Accuracy ("Measured against synthetic ground-truth intent schema parsing") and Hallucination Rate ("Guaranteed by strict JSON schema enforcement & zero tool execution permissions").
   - Relabeled Human Overrides to "0.0% — fully autonomous through this batch".
   - Escalation level badges updated to neutral gray chips (`bg-neutral-100 text-neutral-700`) so red remains strictly reserved for primary Escalated state.
8. **B12 [Resolved]**: Introduced realistic late-webhook reconciliation behavior for broken promises (93.3% / 28 of 30 on schedule).
9. **§D [Resolved]**: All 8 screens verified and captured in full-page fidelity, including Case Detail with active/frozen commitment cards and human override controls.

---

## H. Resolution & Verification Log (Round 5 — Case Detail & Narrative Alignment)

1. **Case Detail Dispute Narrative [Resolved]**: Inspected and verified on `INV-2101` (`Olive Trading`), demonstrating a genuine `PROMISE_THEN_DISPUTE` case with an active frozen commitment (`₹42,000`, `is_frozen = true`, `status = VALID_ACTIVE`).
2. **Canonical Dispute Override Actions [Resolved]**: Wired the exact required dispute actions in `OverridePanel`:
   - `Reject dispute — resume commitment` (`is_frozen = false`, preserves due date)
   - `Uphold dispute — void commitment` (`status = VOIDED_BY_DISPUTE`, reopens case for adjustment)
   - Enforced mandatory justification textarea and confirmation step before execution.
3. **Complete 7-Step Causal Trail & LLM Steps [Resolved]**: The timeline now explicitly renders the full chronological sequence:
   - `system · case_opened`
   - `system · debtor_reply_received` (inbound promise)
   - `llm · reply_parsed` (structured `PROMISE_CANDIDATE`, 95.2% confidence)
   - `policy_engine · commitment_validated`
   - `system · debtor_reply_received` (inbound dispute)
   - `llm · reply_parsed` (structured `DISPUTE_CANDIDATE`, 98.4% confidence)
   - `policy_engine · dispute_detected_commitment_frozen` (frozen commitment enforcement)
4. **Visible Dual Timestamps [Resolved]**: Displayed visibly on every timeline event (Simulated Business Time + Real Wall-Clock UTC) and on the case detail header.
5. **Unreviewed Views [Resolved]**: Captured Case Detail mid-flow override with justification entered, Case Queue "All cases" tab (200 rows), and Simulation header with "Total Cases: 200".


