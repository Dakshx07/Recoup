# Recoup — UI/UX & Layout Specification

Status: **LOCKED — design direction, pending your review before frontend implementation begins.**
This is the source of truth for frontend work. For product/architecture see `01_SYSTEM_DESIGN.md`, for schema/APIs see `02_BACKEND_SPEC.md`, for build sequencing see `03_IMPLEMENTATION_PLAN.md`, for repo layout see `04_REPOSITORY_STRUCTURE.md`, for the Antigravity kickoff see `05_ANTIGRAVITY_PROMPT.md`.

**Reading order for a developer/agent implementing this:** §1 (principles) → §4–§8 (dashboard — build this first) → §9–§13 (design system + components) → §3 (landing page — build this last, if at all before the deadline).

---

## 0. The one-sentence rule that resolves every design disagreement in this document

**Landing page: make someone feel something. Dashboard: make someone find something.** Every visual decision below traces back to which of those two jobs the screen is doing. They are the same product, told two different ways — never the same way twice.

---

## 1. Product UX principles

1. **The interface must narrate the architecture, not just display data.** A judge using the dashboard for five minutes without reading a line of code should be able to reconstruct: invoice → outreach → reply → LLM parsing → policy validation → commitment → (dispute → freeze →) human review → payment → recovery → audit trail. This is the single most important UX goal of the whole product — see §7 and §10 wiring below.
2. **What happened → why it happened → which rule caused it → what the system did → what a human can do now.** Every state-bearing surface (Case Detail above all) must answer these five questions in that order, without requiring a click to get past the first one.
3. **Automated and human actions are never visually ambiguous.** Different actor icon, different tone, different button styling (system/policy actions are informational; human actions are interactive controls) — a reviewer should never have to read text to know who did something.
4. **Color carries state, never decoration.** If a color doesn't map to a defined semantic meaning (§10), it doesn't appear in the dashboard.
5. **Density before whitespace, on the dashboard only.** This is an operational tool used by someone triaging dozens of cases, not a marketing surface — err toward showing more real information per screen, not toward breathing room, as long as hierarchy stays clear.
6. **Restraint is a feature, not a limitation.** On the dashboard, if a design choice makes the product feel more "designed" but doesn't make information easier to find or trust faster, cut it.
7. **The landing page is allowed to be bold. The dashboard is not allowed to be anything else but trustworthy.** These are not in tension — they're doing different jobs, per §0.


---

## 2. Information architecture — complete site map

```
recoup.app (marketing)
├── / (Landing page — single scrolling page, §3)
│   └── CTA → app.recoup.internal (or /app if same domain)
│
app / dashboard (product, auth-gated)
├── /app                          Overview (dashboard home)
├── /app/cases                    Case Queue
│   ├── ?tab=attention            "Needs attention" (default view)
│   └── ?tab=all                  All cases
├── /app/cases/[id]                Case Detail
├── /app/audit                    Audit Log (global, filterable — incl. payments)
├── /app/evaluation                Evaluation
│   └── ?tab=model-activity        LLM activity sub-view
├── /app/policy                    Policy Engine (read-only config view)
├── /app/simulation                Simulation & Demo Data (dev/demo-mode only)
└── /app/404, /app/error           Fallback states (§15)
```

**Screens deliberately NOT built, and why** — the brief asked me to evaluate each candidate, not build all of them:

| Candidate | Decision | Why |
|---|---|---|
| Human review queue (separate screen) | **Not built** — folded into Case Queue's `?tab=attention` default filter | Same underlying data as the general queue, just a different filter (`DISPUTE_OPEN`, `GHOSTED` past threshold, `ESCALATED`). A second screen for the same rows with a different `WHERE` clause adds navigation cost without adding capability. |
| Escalated cases (separate screen) | **Not built** — same reasoning, another filter state on Case Queue | Same as above. |
| Payment verification (separate screen) | **Not built** — folded into Audit Log as `entity_type=payment` filter | Payments are always attached to a case; a standalone ledger view would just be a filtered version of the same audit data. |
| LLM activity (separate screen) | **Not built** — folded into Evaluation as a sub-tab | It's observability/evaluation data (confidence, schema-validity, hallucination rate), not a distinct workflow — belongs next to the metrics it feeds. |
| Processing / jobs monitor | **Not built as a polished screen** — exposed as a small collapsible debug panel, not in primary navigation | It's implementation detail (the Postgres queue), not a business workflow. Showing it prominently would pad the product without demonstrating anything a judge cares about; a debug panel keeps it inspectable without pretending it's a feature. |
| Settings | **Not built** | Nothing meaningful to configure for a single-reviewer MVP. A settings screen with one option is worse than no settings screen. |
| Simulation & Demo Data | **Built** | This is the screen you'll actually be driving during the live demo/video — batch generation and multi-day clock advancement deserve a real interface, not just an API you curl. |
| Policy Engine (config view) | **Built** | Directly, visually proves the "rules are named constants, not hidden in code or decided by the model" claim — this is one of your strongest interview-defense artifacts, made visible. |
| Audit Log (global) | **Built** | The single best demonstration of the auditability claim — lets a judge search across every case, not just the one they happen to be looking at. |


---

## 3. Landing page — structure and visual direction

### 3.1 Visual intensity map (read this before the section breakdown)

Intensity doesn't stay high throughout — it moves deliberately, and the movement *is* the argument:

```
Nav        ▂▂  (near-zero — must stay legible at all times)
Hero       ▇▇▇▇▇▇▇▇  (peak — the emotional hook, atmospheric + dither)
Problem    ▁▁  (drop to near-zero — clean typographic contrast beat)
How it     ▃▃▃  (light — one subtle grain wash, content must stay legible)
works
AI/LLM     ▂▂  (low — this section makes a rigor claim; mood art undercuts rigor)
boundary
Workflow/  ▃▃▃  (light — subtle texture behind an annotated flow diagram)
guardrails
Trust/     ▁▁  (near-zero — a real screenshot of the actual product, crisp, undistorted)
audit
Evaluation ▁▁  (near-zero — numbers must read as precise, not stylized)
CTA        ▅▅  (medium — echoes the hero's motif at lower opacity, closes the loop)
Footer     ▁▁  (near-zero)
```

**The rule this encodes:** atmosphere belongs where you're making someone *feel* the problem is real (hero) or *feel* the handoff into the product (CTA). Everywhere you're making a *credibility* claim — architecture, rigor, numbers, the actual UI — the visual treatment gets quieter, not louder, because dither/grain reads as "art directed" and credibility claims need to read as "just true." This is also why the trust/audit section shows the *real product screenshot* rather than another illustration — nothing sells "this is real software" like the actual software.

### 3.2 Section-by-section

**Navigation (persistent, sticky)** — Logo left, minimal text links (Product · How it works · Trust · GitHub), single CTA button right ("View live demo"). Background: transparent over the hero, gains a subtle backdrop-blur + solid fill once scrolled past the hero (functional — keeps nav legible over whatever's beneath it, not decorative). No dither, ever, on nav chrome — it's the one element that must stay identical and legible at every scroll position.

**Hero — CONFIRMED image.** Peak intensity. Use the generated composition of scattered blue threads across a cream field converging into a single dark diamond node ("Image 1" from the reference set) as-is, full-bleed or near-full-bleed behind the headline — no reinterpretation needed, it already is the product's metaphor: many scattered, uncertain signals converging into one verified point. Headline carries the actual claim: **"Every promise to pay, tracked, verified, and provable."** Subhead: one line naming the problem (manual chasing, no record of what was actually promised). CTA: "See it in action" → scrolls to the trust/audit section's product screenshot, not straight to signup — you're building credibility before asking for a click. This is the one place a slow ambient shimmer/grain animation and gentle scroll parallax (image moves at ~0.3× scroll speed) are earned. Cream stays inside this image panel only — it does not become the page's background color; everywhere outside the art stays clean white/near-white per §3.1's intensity map, so the page reads as infrastructure with one striking illustration, not as a cream-toned brand throughout.

**CTA section — same image, not a new one.** Reuse this identical composition, cropped tighter and at lower opacity, as the closing bookend (already specified below) — one hero visual, echoed once, never a second illustration introduced. The other four images generated alongside it (concentric rings/lone figure, plain gradient horizon, figures walking toward light, hand-and-orb architecture) are held in reserve, not used in this build — each either competes with the hero's specific "convergence" metaphor or pulls the page's register away from "recovery infrastructure" toward generic atmosphere. If a second illustration is ever wanted later, the concentric-rings image is the next-best fit — but v1 ships with one image, used twice.

**Problem section** — Intensity drops to near-zero on purpose, as a contrast beat after the hero. Clean typography, generous whitespace, 2–3 short declarative lines (e.g., "Reminders get sent. Promises get made. Nobody tracks which ones get kept."). No imagery, or none beyond a single thin rule/divider. This is a breather, not a filler section — the drop in intensity is what makes the next section's return to texture feel intentional rather than random.

**How it works** — Medium-light intensity. A clean, editorial horizontal step diagram (Invoice → Outreach → Reply → Commitment → Resolution), legible icons/labels — this needs to inform, so no dither *over* the diagram itself. A single, very low-opacity grain wash may sit behind the whole section as connective texture (continuity with the hero without repeating its loudness) — grain-as-connective-tissue, not grain-as-spectacle.

**AI / LLM boundary section** — Deliberately quiet. This section makes the project's central rigor claim, so it earns the most restrained treatment on the page: a clean two-panel comparison — "What the AI does" (soft blue tint, drafts/parses) beside "What decides" (neutral, checkmark iconography, the Policy Engine) — directly visualizing the LLM boundary from `02_BACKEND_SPEC.md` §5. No dither, no motion beyond a simple fade-in.

**Recovery workflow / guardrails section** — Light intensity returns. A simplified version of the state machine (not the full 10-state diagram — the arc: Outreach → Promise → Monitor → Kept/Broken/Disputed → Resolution) with small annotated callouts for quiet hours, contact caps, and the dispute-freeze rule. A subtle textured background behind the diagram only, at low opacity.

**Auditability / trust section** — Near-zero intensity, highest credibility payload. A real, cropped, browser-chrome-framed screenshot of the actual Case Detail audit trail (the screen already mocked up earlier in this conversation) — crisp, undistorted, no dither over it. Optional: very subtle static (non-animated) grain in the frame surrounding the screenshot, never touching the screenshot's own pixels. This is the moment the page proves it isn't vaporware.

**Evaluation / results section** — Near-zero intensity. Large, precise, stat-led typography for the headline number (₹ recovered, dispute-handling correctness), accompanied by the baseline-vs-agent comparison chart. Numbers need to read as trustworthy, not stylized — no dither, no heavy motion, a simple count-up animation on the headline number is the one motion exception here (it's a common, well-understood pattern for stat reveals and doesn't compromise legibility).

**CTA section** — Intensity rises again, echoing the hero's motif at lower opacity/scale — a deliberate bookend, not a new idea. Headline ties to positioning ("Built for how recovery already works at Razorpay's scale" or similar, avoid overclaiming). Button: "Explore the live dashboard." This is the handoff moment — see §3.4.

**Footer** — Near-zero. Minimal links (GitHub, docs, "Built for the Razorpay AI Buildathon 2026"), no imagery.

### 3.3 Motion — landing page (expressive, but purposeful)

- Hero: slow ambient grain/shimmer loop + gentle scroll parallax (~0.3× rate) — the only continuous ambient motion on the page.
- Scroll reveals: per-section fade + 20–30px translate-up on intersection, 400–600ms ease-out — applied once per section, not per element/word (avoid the over-staggered "everything cascades in" feeling).
- Workflow diagram: the flow line may draw itself in on scroll, once — purposeful (clarifies sequence), not repeated elsewhere.
- Screenshot frame: optional subtle hover-tilt, nothing more.
- Evaluation number: one count-up animation on first view.
- **Text/font motion specifically:** hero headline + subhead fade + 12px translate-up as a single block on load, once — not per-word or per-letter stagger. Section headers inherit their parent section's one-time scroll-reveal (§3.3 above) rather than a separate text-specific animation. No typewriter effects, no hover-triggered letter-spacing expansion on nav links, no looping text motion anywhere.
- **Never:** autoplay video, cursor-follow effects, infinite decorative loops outside the hero, scroll-jacking, per-letter/per-character text stagger (a common template tell — avoid it for that reason alone).

### 3.4 The marketing → product transition

Clicking "Explore the live dashboard" is a **deliberate tonal handoff, not a continuation.** Recommended treatment: a brief (300–400ms) cross-fade where the atmospheric/dither imagery dissolves out as the flat, Blade-toned dashboard shell fades in. No shared motion language carries over — the dashboard should feel like *arriving somewhere calmer*, on purpose. Do not attempt to make the dashboard's entrance feel like "more of the landing page" — that would undercut the tonal distinction that's the whole point of this design (§0).


---

## 4. Dashboard — navigation model

**Sidebar, not top nav.** Operational fintech dashboards (Stripe, Razorpay's own dashboard, Linear) favor a left sidebar for a specific reason: it leaves full horizontal width for dense tables, and scales better as nav items grow. Top nav is the landing page's pattern, not the dashboard's — keeping them different is itself part of the tonal separation from §0.

**Structure:**
```
┌─────────────┐
│ Recoup       │  ← wordmark, small, top of sidebar
│              │
│ Overview     │
│ Case queue  ⁹│  ← badge = count needing attention
│ Audit log    │
│ Evaluation   │
│ Policy       │
│──────────────│  ← divider, visually distinct section
│ Demo tools   │  ← label, smaller/muted
│ Simulation   │
│──────────────│
│ ● Reviewer   │  ← identity, bottom of sidebar
└─────────────┘
```

The divider before "Demo tools" matters: it keeps the illusion that this is a real production product intact, while still making the simulation control fully accessible for the demo/video — a judge should be able to tell at a glance which nav items are the product and which are the evaluation harness.

**Breadcrumbs:** `Case queue / INV-2044` pattern on Case Detail (already established in the earlier mockup). Not needed on top-level screens (sidebar active state already answers "where am I").

**Back behavior:** returning from Case Detail to Case Queue preserves the previous filter/tab/scroll state — never resets to the default filter. A reviewer investigating a batch of disputed cases shouldn't lose their place after checking one.

**Deep linking:** every case has a real URL (`/app/cases/[id]`); queue filters reflect in query params (`?tab=attention&state=DISPUTE_OPEN`) so a specific view is shareable — useful for pointing a panelist directly at the dispute-freeze example case.

**Active states:** sidebar item gets a filled/tinted background (not just a color change on the label) — needs to be readable at a glance, not just on close inspection.

**Keyboard:** `Tab`/`Shift+Tab` standard focus order through sidebar → filters → table rows → row actions. `Enter`/`Space` activates. `Esc` closes any open drawer/modal. `/` focuses the search input from anywhere on Case Queue — small, common pattern, costs little to add.


---

## 5. Screen specifications

### 5.1 Overview (`/app`) — dashboard home

**Job:** answer "is anything on fire, and where do I go first" in under five seconds.

- Top: same 4-metric strip as Case Queue (Recovered, At risk, Active cases, Escalated) — consistent placement builds a landmark a reviewer learns once.
- "Needs attention" panel: the top 5–8 rows from the `attention` filter (disputes, ghosted-past-threshold, escalated), each a compact row with a **"Why"** one-liner (e.g., "Dispute raised, awaiting your review" / "No reply after 3 attempts") — this is the single highest-value piece of UI on this screen, since it's doing triage for the reviewer before they ask.
- Recent activity: a short, reverse-chronological feed of the last ~10 audit events across all cases (system-wide, not per-case) — gives a sense of the system actively working, and doubles as a live preview of what the full Audit Log screen contains.
- Do **not** put the evaluation chart here — Overview is for "what needs a human right now," Evaluation is a separate concern with a separate screen; mixing them dilutes both.

### 5.2 Case Queue (`/app/cases`)

Already mocked up (earlier in this conversation) — this section adds the parts that mockup didn't cover.

- **Tabs:** "Needs attention" (default) / "All cases" — not a filter dropdown for this specific split, since it's the single most common navigation decision a reviewer makes; a tab is faster than a dropdown for a binary, frequent choice.
- **Filters (within either tab):** state (multi-select), amount range, escalation level — dropdown/multi-select, not tabs, since these are secondary and less frequent.
- **Search:** by debtor name or invoice number, single input, `/` to focus.
- **Sorting:** default sort is "most urgent first" (escalated → disputed → ghosted-approaching-threshold → active → closed), not alphabetical or by date — the default order should already be doing triage work.
- **Pagination:** cursor-based "load more" at the bottom rather than numbered pages — a queue is a stream you triage top-down, not a reference table you jump around in.
- **Empty state:** "No cases need attention right now" with a small checkmark glyph, not an illustration — calm, not celebratory (this is a fintech tool, not a to-do app).
- **Loading state:** skeleton rows matching the real row layout (gray pulsing blocks in place of debtor/amount/badge), not a spinner — preserves the table's shape so nothing jumps when data arrives.
- **Error state:** inline banner above the table ("Couldn't load cases — retry"), table area shows nothing rather than stale data.
- **Bulk actions:** **not included.** Every case decision here is individually consequential (money, compliance) — a "bulk escalate 12 cases" action would work against the whole point of bounded, auditable, one-decision-at-a-time actions. This is a deliberate omission, not an oversight.
- **Row interaction:** entire row is clickable (not just a "View" link) to reduce click precision required when scanning quickly; row hover gets a background tint only, no shadow/lift.
- **Status badges:** consistent with the palette established in the earlier mockup (§10 below has the full semantic table).
- **Amount/date formatting:** amounts right-aligned, `₹` prefix, comma-grouped, no decimals unless non-zero paise (keeps the column visually countable); dates as `Fri 28 Aug` not `2026-08-28` — human-scannable over machine-precise, since precision lives in the tooltip/detail view, not the list.
- **Priority/escalation visibility:** escalated rows get a small left-edge color bar (red) in addition to the badge — visible even in peripheral vision while scanning, not just on close reading.

### 5.3 Case Detail (`/app/cases/[id]`)

Already mocked up in detail earlier in this conversation (header, two-column layout, timeline, commitment card, override panel). Additions:

- **LLM-generated interpretation is visually distinguished from the policy decision that followed it** — the raw parse (amount/date/confidence extracted) sits in its own sub-block, collapsed by default with a "view raw model output" expander, *before* the policy decision that consumed it. This ordering is not cosmetic — it's the UI enforcing the same sequence as the architecture: LLM proposes, policy decides.
- **Simulated vs. real timestamps:** shown together but visually de-emphasized (small, muted, top-right — as already mocked), expandable on hover/click to show both values explicitly, never just one or the other.
- **Dispute/escalation state gets its own visually distinct treatment** in the timeline (as mocked — the only colored background on an otherwise neutral timeline) so the one event that actually requires human judgment doesn't have to compete with the rest.
- **Payment status:** shown as a small dedicated card (amount verified, `paid_at`, verification source) once a payment exists — not folded into the commitment card, since a payment can exist independent of any commitment (the "any state → CLOSED_PAID" rule).
- **Human override controls require a justification field before the action button becomes enabled** (not just "required on submit") — catches an empty justification before the click, not after, which matters for a control this consequential.
- **Destructive/high-consequence actions** (uphold dispute → void commitment; force write-off) get a confirmation step — a second, explicit "confirm" click with the consequence stated in plain language ("This will void the ₹1,20,000 commitment and cannot be undone"), not a generic "are you sure?"

### 5.4 Audit Log (`/app/audit`)

**Job:** let a judge verify the auditability claim without needing to already know which case to look at.

- Global, reverse-chronological, filterable by: entity type (case/commitment/invoice/payment), actor (system/policy_engine/llm/payment_verifier/human), event type, date range (simulated or real).
- Each row: timestamp (both), actor icon, event type, one-line summary, entity link (jumps to the relevant Case Detail).
- Search by entity ID or debtor/invoice number.
- This screen is intentionally close to a raw table — it's for verification, not storytelling (Case Detail's timeline does the storytelling; this screen does the proving).

### 5.5 Evaluation (`/app/evaluation`)

- Same 7-metric-card layout pattern as elsewhere (recovery rate, promise-kept rate, false-escalation rate, dispute-handling correctness, classification accuracy, hallucination rate, human-override rate) — consistency with Overview's metric strip is deliberate.
- One chart: baseline (naive blind-retry-equivalent) vs. agent, on recovery rate.
- Scenario breakdown table: the 8 synthetic scenario types from `03_IMPLEMENTATION_PLAN.md` §2, with pass/fail counts per scenario — this is where "dispute-handling correctness" becomes inspectable, not just a headline number.
- Sub-tab: **Model activity** — a table of `reply_parses` (model version, confidence, schema-validity, intent type), filterable, exists to make the hallucination/schema-failure rate verifiable at the individual-call level, not just as an aggregate.

### 5.6 Policy Engine (`/app/policy`)

**Job:** prove the rules are named, fixed, and not something the model decided.

- A clean, read-only table: rule name, current value, one-line description — directly reflecting `02_BACKEND_SPEC.md` §6 (quiet hours, contact cap, promise horizon, partial-payment threshold, escalation ladder steps, max disputes before mandatory escalation).
- The partial-payment threshold and escalation-ladder day-counts are visually flagged (small "placeholder default" tag) — same honesty the spec docs already carry, made visible in the UI itself rather than only in markdown.
- The dispute-freeze rule gets a short, plain-language explanation block here too — this screen is a good second place (after Case Detail) for a judge to encounter that specific piece of reasoning.

### 5.7 Simulation & Demo Data (`/app/simulation`)

- Batch generation control: trigger `/api/synthetic/generate-batch`, shows a summary once complete (200 invoices, scenario breakdown).
- Clock control: current simulated day, an "advance by N days" input plus quick buttons (+1 day / +3 days / +7 days), and a log of what fired on the last advance (mirrors the top-bar quick control from Case Queue, but with more detail — this is the screen you'd actually have open while narrating the demo video).
- Clearly labeled as demo/eval tooling (per the sidebar divider in §4) — never presented as if it were a production feature.


---

## 6. Key UX flows

### 6.1 Case investigation flow

`Overview (sees case in "needs attention")` → `click row → Case Detail` → `read header (state, amount, days overdue)` → `scan timeline top-to-bottom (What → Why → Which rule → What system did)` → `check commitment card for current terms` → `decide: does this need a human action?` → `if yes: use Override panel with required justification` → `confirm if destructive` → `return to queue, filter state preserved`.
Design commitment this flow depends on: the timeline's chronological, unbroken narrative — never paginate or collapse it in a way that breaks the "read top to bottom and understand everything" property.

### 6.2 Dispute → freeze → human resolution flow

`Debtor reply arrives` → `(behind the scenes: LLM parses as dispute_candidate)` → `case badge changes to "Dispute open" in Case Queue` (visible without opening the case) → `reviewer opens Case Detail` → `sees the amber-highlighted freeze event in the timeline, with the one-line reason ("commitment frozen, not cancelled")` → `commitment card shows "Frozen — under dispute review" with the original terms still visible, not hidden` → `reviewer uses Override panel: "Reject dispute — resume commitment" or "Uphold dispute — void commitment"` → `confirmation step states the consequence` → `submits with justification` → `timeline appends the resolution event` → `commitment card updates to reflect the outcome`.
This flow is the single most important one to get right in the whole product — it's the concrete proof of the architecture's central claim, and it should be possible to demo in under 30 seconds once a reviewer knows where to look.

### 6.3 Payment → recovery → audit flow

`Razorpay webhook arrives` → `(idempotency + independent verification, invisible to the UI)` → `Payment card appears/updates on the relevant Case Detail` → `if it satisfies an active commitment: commitment status updates to Kept/Partially kept, case may close` → `Overview's "Recovered" metric updates` → `Audit Log gains a payment_verified row, linkable back to the case` → `Evaluation's recovery-rate metric reflects it on next computation`.
This flow should be demonstrable via the Simulation screen (advance clock past a due date with a scripted on-time payment scenario) without needing a real webhook during the live demo.


---

## 7. UX states

Not every component needs every state — listing all twelve for a static metric card would be padding. Specified only where meaningful.

**Case Queue row**
Default (as mocked) · Hover (background tint only, no shadow/lift) · Focus (visible focus ring, keyboard-navigable) · Loading (skeleton block matching row shape) · Empty (calm empty-state message, no illustration) · Error (row-level failure, e.g. a single row's data couldn't resolve, shown as a muted row with a small retry icon rather than breaking the table).

**Filter / search controls**
Default · Focus (ring + border color shift) · Active (applied filter shown as a removable chip above the table, so "what am I looking at" is always answerable without opening the dropdown again) · Disabled (while a search is in flight, briefly).

**Status badge**
Default only — badges are informational, not interactive, so hover/focus/active don't apply. This is itself a UX decision: making a badge *feel* clickable when it isn't would create false affordance.

**Human override button**
Default (outlined, not filled — per the earlier mockup's rule) · Hover (subtle fill tint) · Focus (ring) · Disabled (until justification is non-empty) · Loading (brief spinner replacing label text while the transaction commits) · Destructive-confirm (a second explicit step, plain-language consequence stated, confirm button uses the danger color only at this final step — not before) · Success (brief inline confirmation, e.g. a checkmark + "Resolved" replacing the button, before the panel updates) · Permission-restricted (if a non-authenticated session somehow reaches this screen, the entire override panel renders disabled with a one-line explanation, never just silently missing).

**Timeline event**
Default · New-arrival highlight (brief background-tint flash that settles to normal over ~1s, for Realtime-delivered events — a "something just happened" signal, not a decoration) · Expanded (raw model output or full detail shown inline, not in a separate modal — keeps the reading flow linear).

**Metric card (Overview/Evaluation)**
Default · Loading (skeleton number placeholder, not a spinner over the whole card) · Error (a small inline "—" with a tooltip explaining the metric couldn't compute, rather than hiding the card).

**Global page states**
404 (`/app/404`) — minimal, on-brand with the dashboard's restrained tone (not the landing page's atmosphere), single link back to Overview.
Error boundary — a calm, specific message where possible ("Couldn't reach the database" vs. a generic crash screen), never a raw stack trace in the built product.
Permission-restricted — an unauthenticated visit to any `/app/*` route redirects to a simple Supabase Auth sign-in screen, styled consistently with the dashboard (not the landing page).


---

## 8. Design system

**Prefer Blade tokens/components everywhere they exist (see §11 for the mapping and its honesty caveat). What follows are the rules for where Blade needs product-specific decisions layered on top, and for the landing page, which is explicitly outside Blade's scope.**

### Typography — full system

**Two type families total across the entire product, never three.** Landing page uses a display/body pairing; dashboard uses one workhorse UI font. Neither borrows the other's display face — that boundary is what keeps the tonal split in §0 intact at the font level, not just the color level.

**Dashboard font:** Blade's default typeface (confirm the exact family from the installed `@razorpay/blade` package before implementation). If Blade doesn't bundle/enforce one, fall back to **Inter** — it's specifically optimized for UI legibility at small sizes, free, and the safe default for a dense data tool. One family, two weights in practice (400 regular, 500 medium for emphasis) — avoid 600/700 bold except the rare headline number, since heavy weights read as "shouty" in a dense operational screen.

**Landing page headline font:** **Fraunces** (a expressive, optical-sized serif, freely available, widely used on 2025–2026-era premium tech/editorial landing pages) for the hero headline only — and, sparingly, for section labels that want to feel like a chapter heading (e.g., "How it works," "Built to be audited") rather than a UI label. This is the one deliberate typographic flourish on the whole product, matching the "editorial, memorable" brief for the landing page specifically — it must never appear on the dashboard.

**Landing page body/nav font:** **Inter** or **Geist** (either is fine — pick one, stay consistent for the whole page) for nav links, subheads, body copy, button labels. This is also a deliberate choice: pairing an expressive serif headline against a plain, confident sans for everything else is what keeps the page reading "premium infrastructure," not "template with a fancy font everywhere."

**Monospace (dashboard only):** system mono stack by default (zero dependency); **JetBrains Mono** or **IBM Plex Mono** if you want a custom one, used for invoice numbers, IDs, and entity references — exactly as already shown in the Case Queue mockup's `INV-2041` styling. Never used for prose.

**Type scale — dashboard**

| Role | Size | Weight | Line-height | Letter-spacing | Notes |
|---|---|---|---|---|---|
| Page title | 20–22px | 500 | 1.3 | 0 | One per screen |
| Section label | 11–12px | 500 | 1.3 | +0.04em, uppercase | "Audit trail," "Commitment" — already established in the mockups |
| Body / table text | 13–14px | 400 | 1.4 | 0 | Default for most content |
| Metadata / timestamps | 11–12px | 400 | 1.3 | 0 | Muted color, never the primary text color |
| Metric / headline numbers | 20–24px | 500–600 | 1.2 | −0.01em | `font-variant-numeric: tabular-nums` always, so digits align in columns |
| Mono (IDs, invoice numbers) | 12–13px | 400 | 1.3 | 0 | Muted color unless it's the row's primary identifier |

**Type scale — landing page**

| Role | Font | Size (desktop) | Weight | Line-height | Notes |
|---|---|---|---|---|---|
| Hero headline | Fraunces | 56–72px | 400–500 (use Fraunces' optical weight, not a heavy cut) | 1.05 | The one place the serif appears large |
| Section headline | Fraunces | 32–40px | 400–500 | 1.15 | "How it works," "Built to be audited," etc. |
| Subhead / lead paragraph | Inter/Geist | 18–20px | 400 | 1.5 | One line under the hero, short paragraphs elsewhere |
| Body copy | Inter/Geist | 16px | 400 | 1.6 | Generous line-height — landing page earns whitespace, dashboard doesn't |
| Nav / button labels | Inter/Geist | 14–15px | 500 | 1.3 | 0 letter-spacing — no expanded-tracking nav-link hover trick |
| Evaluation headline number | Inter/Geist (numerals) | 48–64px | 500 | 1.1 | Tabular nums, count-up on scroll-into-view (§3.3) |

### Borders — full system

- **Dashboard cards:** 1px solid border (neutral/border token), radius 8px, full border on all four sides — never a bottom-only "underline card."
- **Dashboard tables:** the container gets one full 1px border with 8px radius; individual rows get only a bottom hairline divider, never full cell borders — a fully-gridded table reads as a spreadsheet, not a product.
- **Inputs/selects:** 1px border, neutral by default, shifts to the accent color plus a visible focus ring on focus — never rely on the ring alone, the border color change matters for anyone not using a mouse.
- **Buttons:** primary (filled) has no visible border; secondary/outlined has a 1px neutral border that darkens slightly on hover; ghost/text buttons have neither border nor fill.
- **Badges:** no border in the default case — filled background is enough contrast; add a 1px border only if a specific badge color's fill doesn't meet contrast against the page background on testing.
- **Divider rules:** used sparingly, only between genuinely distinct regions (e.g., between the metric strip and the case table on Overview) — never inserted between every element on a screen. Overusing thin divider lines is a common tell of a template-generated layout; if you're not sure a divider is earning its place, cut it and rely on spacing instead.
- **Landing page:** borders are mostly absent — whitespace and image edges do the separating. Where two purely typographic sections meet (e.g., Problem → How it works), a single thin rule is acceptable as a seam marker; never place a hard rule across an atmospheric image section, it reads as a production mistake.
- **Spacing:** consistent scale (Blade's spacing tokens) — dashboard errs tight (dense, per Principle 5); landing page errs generous (whitespace as a deliberate pacing tool between intensity beats, per §3.1).
- **Radius:** small, consistent radius throughout the dashboard (as used in every mockup so far) — no mixing sharp and heavily-rounded corners on the same screen. Badges are the one full-pill (fully rounded) exception, since a pill shape is what makes a status chip instantly scannable as a chip rather than a label.
- **Surface hierarchy:** maximum one level of elevated surface (e.g., the metric-card background tint) above the base page background — no card-on-card nesting (Principle: "no card-on-card," already stated in the earlier mockup discussion).
- **Icons:** one consistent icon set across the whole dashboard (actor icons — system/policy/llm/human/payment_verifier — must be visually distinct from each other at a glance, not just by color).
- **Tables:** dense row height, right-aligned numerics, hairline row dividers, hover tint, no zebra striping (zebra striping fights the semantic-badge coloring for attention).
- **Buttons:** primary (filled, one per screen at most — the single most important action), secondary/outlined (everything else, including all override actions per Principle 3), ghost/text (tertiary, e.g. "View raw output").
- **Inputs / selects:** Blade's field components, consistent height with the filter bar already established.
- **Tabs:** used for the Case Queue's attention/all split and Evaluation's metrics/model-activity split — not overused elsewhere; a tab implies two persistent, equally-weighted views of the same data, not a general-purpose navigation device.
- **Badges:** the semantic state palette (§10) — no other badge colors introduced for anything non-state-related (e.g., don't badge a "new" case in a decorative accent color; if it needs a badge, it needs a defined semantic meaning first).
- **Alerts/banners:** reserved for system-level conditions (degraded LLM mode, quiet-hours block, load failure) — not for routine information, which lives inline instead.
- **Tooltips:** used for the dual-timestamp expansion and for any truncated text (long debtor names, long justification text in a compact view).
- **Modals/drawers:** confirmation for destructive actions uses a modal (interrupts on purpose, given the consequence); the override panel itself is inline on Case Detail, not a drawer, since it should feel like a natural part of the investigation, not a separate mode.
- **Timeline:** custom component (§12) — vertical, left-rule connector, actor icon + event + expandable detail, exactly as mocked.
- **Charts:** the one baseline-vs-agent bar chart and any scenario-breakdown visualization use Blade's color tokens for consistency even though the charting itself is a custom/third-party component (§12).
- **Empty states:** calm, text-led, no illustration (Principle 6 — restraint), consistent across Case Queue, Audit Log, and Evaluation's "no data yet" moments.
- **Toasts:** used for successful override confirmations and background-sync failures — brief, dismissable, never for anything that needs a persistent record (that's what the audit trail is for).


---

## 9. Color semantics (dashboard)

| Meaning | Applies to | Notes |
|---|---|---|
| Blue (accent/info) | `AWAITING_REPLY`, links, active nav item, focus rings | "Waiting / informational / active interaction" — never used decoratively |
| Green/teal (success) | `COMMITMENT_ACTIVE`, `CLOSED_PAID`, "Recovered" metric | "Healthy / on-track / recovered" |
| Amber (warning) | `DISPUTE_OPEN`, frozen commitments, quiet-hours-blocked banners | "Frozen / needs judgment / caution" — never used for a routine info message |
| Red (danger) | `ESCALATED`, error states, destructive-confirm buttons | "Escalated / broken / error" — reserved, must stay rare to stay meaningful |
| Neutral gray | `OPEN`, `GHOSTED`, `CLOSED_WRITTEN_OFF`, metadata text, timestamps | "Normal / inactive / not yet meaningful" |

**Verify exact hex/token values against the actual `@razorpay/blade` package during implementation** — this table specifies *meaning-to-role* mapping, not literal color values, since guessing Blade's exact tokens from memory risks being wrong or stale. Pull the real semantic tokens (Blade will have its own success/warning/danger/info/neutral roles) and map this table onto them directly rather than inventing new hex values.

**Hard rule:** color is never the only signal for a state — every badge carries its own text label (already true in every mockup so far), so the product remains usable for colorblind users without any additional workaround.

---

## 10. Motion guidelines (dashboard) — recap and consolidation

Already stated throughout §5/§7 in context; consolidated here for implementation reference:

- Row hover: background tint only, ~100ms, no transform.
- State/badge changes: color cross-fade, 150–200ms, no bounce/spring easing.
- Drawer/modal open: fade + scale (0.98→1), ~200ms, standard ease — matches typical design-token `--dur-fast`/`--dur-base` naming; confirm against Blade's actual motion tokens if present.
- Loading: skeleton screens for primary content (tables, metric cards), never a full-screen spinner once the shell has loaded once.
- New audit event (Realtime): highlight-flash that settles over ~1s — signal, not decoration.
- Table sort/filter: instant reflow, no animated row reordering (a common over-engineering trap — explicitly skipped).
- **Text/font motion:** none, beyond the evaluation headline number's one-time count-up. All other text renders instantly — no fade-in per block, no per-letter reveal, no typewriter effect. This is a data tool; text appearing gradually only slows down someone trying to read it.
- **Never on the dashboard:** parallax, scroll-triggered reveals, ambient grain/dither motion, autoplay anything, cinematic transitions of any kind. If it would look at home on the landing page, it does not belong here — that's the whole test.


---

## 11. Blade component mapping

**Honesty note:** Blade's exact component/prop names weren't fully inspectable from outside the package during this planning phase (its docs site is a JS-rendered Storybook). The mapping below states *intent* — confirm exact component names against the installed `@razorpay/blade` package/Storybook before implementation, and treat anything marked "verify" as a naming guess based on typical design-system conventions, not a confirmed API.

| Product UI element | Blade component (verify exact name) | Notes |
|---|---|---|
| Case table | Table | Custom cell renderers for badges/amounts layered on top |
| Status badge | Badge / Tag *(verify)* | Map to Blade's semantic color props, not custom hex values |
| Buttons (primary/secondary/ghost) | Button | Use Blade's built-in variants rather than custom styling |
| Filters dropdown | Dropdown / SelectInput *(verify)* | |
| Search input | TextInput, with leading icon slot | |
| Tabs | Tabs | |
| Confirmation dialog | Modal / Dialog *(verify)* | For destructive override confirmation |
| Alert / banner | Alert / Banner *(verify)* | Degraded-mode and quiet-hours-blocked messages |
| Tooltip | Tooltip | Dual-timestamp expansion, truncated text |
| Toast | Toast *(verify)* | Override confirmations |
| Breadcrumb | Breadcrumb *(verify — may not exist; fall back to custom if absent)* | |
| Pagination / load-more | Pagination *(verify)* | |
| Text area | TextArea | Override justification field |
| Skeleton loading | Skeleton *(verify — may not exist)* | Fall back to a simple custom shimmer block if absent |
| Sidebar navigation | Layout/navigation primitives *(verify — likely composed from Box/Link primitives rather than one dedicated component)* | |
| Metric/stat card | Card as wrapper + custom internal layout | Blade likely provides a generic `Card`, not a purpose-built "stat card" |

---

## 12. Custom components required

Components Blade does not provide and that must be built from scratch (styled using Blade's design tokens for visual consistency, even though the component logic is custom):

- **Audit Trail Timeline** — vertical event list, actor icons, expandable raw-output detail, dual timestamps. The single most important custom component in the product.
- **Compact lifecycle stepper** — the small horizontal indicator on Case Detail showing where a case currently sits in its overall lifecycle (optional polish, not P0).
- **Metric/stat card internals** — the number + label + optional trend layout inside a Blade `Card` wrapper.
- **Baseline-vs-agent bar chart and any evaluation charts** — Blade is a component library, not a charting library; use a lightweight charting option (already decided in `01_SYSTEM_DESIGN.md`'s tech stack) styled with Blade's color tokens.
- **Empty-state block** — calm, text-led, reused across Case Queue/Audit Log/Evaluation.
- **Landing-page atmospheric visuals** — the dither/halftone hero composition, grain washes, and any generative/canvas-based imagery. Entirely outside Blade's scope by design — Blade governs the product, not the marketing page (per §0).
- **Policy Engine rules display** — likely composable from a Blade `Table`, but the "placeholder default" tag treatment is custom.
- **Simulation clock control widget** — day counter, advance-by-N-days input, quick-advance buttons; no off-the-shelf equivalent in a general component library.


---

## 13. Responsive behavior

**Desktop-first, by design, not by neglect.** The dashboard's actual users — you, and the panel reviewing it — will be on a laptop. Optimizing for mobile here would spend build hours on an audience that doesn't exist for this artifact.

- **Dashboard, below ~1024px:** sidebar collapses to icon-only (labels on hover/tooltip); Case Queue table drops secondary columns first (commitment detail, then days-in-recovery), keeping invoice/debtor/amount/state as the irreducible minimum; Case Detail's two-column layout stacks to single-column, timeline first, commitment/override panel below it.
- **Dashboard, below ~640px:** functional but not polished — explicitly out of scope for this build (`03_IMPLEMENTATION_PLAN.md`'s DO NOT BUILD already excludes real mobile optimization); don't spend time here.
- **Landing page:** genuinely responsive, since a marketing page's audience profile is unpredictable — hero composition scales down, multi-column sections (AI-boundary comparison, workflow diagram) stack vertically below ~768px, motion intensity reduces automatically on mobile (disable parallax, keep simple fades) both for performance and because parallax reads worse on touch scroll.

---

## 14. Accessibility

- Color is never the sole state signal (§9) — every badge/status carries a text label.
- Focus-visible rings on every interactive element, dashboard and landing page alike — no `outline: none` without a replacement.
- Keyboard navigation: full tab order through sidebar → filters → table → row actions on the dashboard (§4); modals/drawers trap focus while open and return it to the triggering element on close.
- Screen-reader labels on every icon-only control (actor icons in the timeline, sidebar icons when collapsed).
- Form validation (override justification) is announced inline, not only shown as a color change on the field border.
- If Realtime live-updates are implemented (`03_IMPLEMENTATION_PLAN.md`'s SHOULD-BUILD item), the timeline's "new event" region should be an ARIA live region so screen-reader users are notified of new events, not just sighted users via the highlight-flash.
- Contrast: rely on Blade's semantic tokens, which should already meet contrast requirements by design — a specific reason to prefer Blade tokens over inventing new colors, beyond the branding argument already made.

---

## 15. What NOT to do

- Don't use dither/grain anywhere in the dashboard — landing page only, per §0.
- Don't sacrifice usability for visual effects, ever, on the dashboard — if a choice makes a screen look more "designed" but doesn't help someone find or trust information faster, cut it (Principle 6).
- Don't create unnecessary cards — one level of surface elevation maximum, no card-on-card nesting.
- Don't use color decoratively anywhere it could be mistaken for state — if a color doesn't map to §9's table, it doesn't appear.
- Don't introduce animation beyond §10's list on the dashboard — no parallax, no scroll-triggered reveals, no ambient motion, no autoplay.
- Don't invent a custom component where a Blade component already does the job — check §11 before building anything new.
- Don't make the dashboard look like the marketing landing page, or vice versa — the tonal split in §0 is the design, not a compromise between two options.
- Don't obscure audit/state information behind unnecessary interaction — the timeline reads top-to-bottom without required clicks for the primary narrative (What → Why → Which rule → What → What now); expanders exist only for optional depth (raw model output), never for information a reviewer needs by default.
- Don't add bulk actions to the Case Queue — every decision here is individually consequential; batching them undermines the bounded, auditable, one-decision-at-a-time architecture (§5.2).
- Don't build a mobile-optimized dashboard — desktop-first is a deliberate scope decision (§13), not an oversight to apologize for.
- Don't let the landing page's motion language leak into the dashboard's entrance (§3.4) — the handoff should feel like arriving somewhere calmer, on purpose.
- Don't let Fraunces (the landing page's headline serif) appear anywhere on the dashboard, and don't let the dashboard's UI sans become the landing page's headline font — two families, each in its own territory, never swapped or mixed.
- Don't animate text per-letter or per-word anywhere, on either surface — it's a common template tell, not a premium signal, and it actively slows down reading on the dashboard.
- Don't introduce a second illustration on the landing page — one hero image (§3.2), reused at the CTA, is the whole visual system; adding more dilutes the specific "convergence" metaphor that makes the hero mean something instead of just looking nice.

---

## 16. Implementation priority

**The dashboard is the product being judged. The landing page is polish.** This isn't a personal preference — it follows directly from `03_IMPLEMENTATION_PLAN.md`'s locked build order, where nothing landing-page-related appears in MUST BUILD. Build in this order:

1. **[continues MUST-BUILD order from `03_IMPLEMENTATION_PLAN.md`]** Complete all backend MUST items first — none of this document matters if the state machine and Policy Engine aren't working underneath it.
2. **[MUST, dashboard]** Case Queue (§5.2) — the entry point, needed to even see whether the backend is producing correct data.
3. **[MUST, dashboard]** Case Detail (§5.3) — this is the screen that actually gets you hired; the audit trail and override panel are the highest-value UI surface in the entire product.
4. **[MUST, dashboard]** Overview (§5.1) — quick to build once Case Queue's data layer exists, and gives you something to open first in the demo video.
5. **[SHOULD, dashboard]** Audit Log (§5.4) and Evaluation (§5.5) — build once the MUST items work end-to-end; these are what let a judge verify your claims independently rather than trusting your narration.
6. **[SHOULD, dashboard]** Policy Engine view (§5.6) and Simulation & Demo Data (§5.7) — build these once you're preparing for the actual demo recording, since Simulation in particular is the screen you'll be operating live.
7. **[SHOULD, only if time remains after all of the above]** Landing page (§3) — and if time is short, cut scope *within* the landing page before cutting dashboard polish: a minimum-viable landing page is Hero → How it works → Trust/screenshot → CTA, dropping the AI-boundary and Evaluation sections as standalone (fold their key points into "How it works" instead) rather than shipping a half-finished six-section page.

If forced to choose between a beautiful landing page and a Case Detail screen that fully demonstrates the dispute-freeze flow, **build the second one.** The panel scores the architecture and the working product; the landing page is a bonus that makes a good submission look more finished, not a substitute for one.
