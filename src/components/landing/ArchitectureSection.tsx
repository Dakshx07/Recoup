'use client';

import { useState } from 'react';
import { Shield, Database } from 'lucide-react';

export function ArchitectureSection() {
  const [activeLifecyclePath, setActiveLifecyclePath] = useState<'clean_ptp' | 'dispute_freeze' | 'unresponsive'>('clean_ptp');
  const [selectedStage, setSelectedStage] = useState<number>(2); // 0-4 (Stage 03 default)

  const scenarioConfig = {
    clean_ptp: {
      title: 'Path A: Clean Promise to Pay (PTP)',
      summary: 'Debtor provides a firm date. The LLM extracts intent, the Policy Engine registers an active commitment, and a Razorpay webhook verifies settlement.',
      stages: [
        {
          num: '01',
          title: 'Overdue Ingest',
          status: 'Case Initialized',
          progress: '1/5',
          badge: 'DETECT',
          actor: 'ERP / Ingestion API',
          stateDelta: 'OPEN',
          summaryText: 'Invoice INV-2041 (Olive Trading Co. · ₹42,000) ingested into recovery_cases.',
          evidenceLeftTitle: 'Inbound Ingestion Payload',
          evidenceLeft: '{\n  "invoice_id": "INV-2041",\n  "debtor": "Olive Trading Co.",\n  "amount_cents": 4200000,\n  "currency": "INR",\n  "due_date": "2026-01-01",\n  "status": "OVERDUE"\n}',
          evidenceRightTitle: 'State-Transition Service (Atomic Begin)',
          evidenceRight: '-- Acquire case row-lock\nSELECT * FROM recovery_cases WHERE id = \'39fff352\' FOR UPDATE;\n\nINSERT INTO recovery_cases (id, state, amount_cents)\nVALUES (\'39fff352\', \'OPEN\', 4200000);\n\n-- Append immutable audit log\nINSERT INTO audit_events (case_id, event_type, actor)\nVALUES (\'39fff352\', \'case_opened\', \'SYSTEM\');',
          policyRule: 'Unique external_id constraint prevents duplicate case creation',
          llmRole: 'None (System Ingestion)',
          table: 'recovery_cases',
        },
        {
          num: '02',
          title: 'Adaptive Outreach',
          status: 'Notice Dispatched',
          progress: '2/5',
          badge: 'ACT',
          actor: 'Policy Engine + LLM Drafter',
          stateDelta: 'OPEN ➔ AWAITING_REPLY',
          summaryText: 'Drafted tailored reminder with Payment Link, validated against 21:00-09:00 IST Quiet Hours and 3-touch cap.',
          evidenceLeftTitle: 'LLM Brand-Voice Draft',
          evidenceLeft: 'Subject: Invoice INV-2041 Overdue Notice\n\n"Hi Olive Trading team, payment of ₹42,000 was due Jan 1. Please process using your secure Razorpay link: https://rzp.io/i/rec_2041 or reply with your payment plan."',
          evidenceRightTitle: 'Policy Gate Validation Preconditions',
          evidenceRight: '✓ Check 1: Time is 11:30 IST (Outside Quiet Hours 21:00-09:00 IST)\n✓ Check 2: 0 touches in rolling 7 days (Cap: 3 touches / 7d)\n\nUPDATE recovery_cases\nSET state = \'AWAITING_REPLY\'\nWHERE id = \'39fff352\';\n\nINSERT INTO outreach_messages (case_id, channel, body_hash)\nVALUES (\'39fff352\', \'EMAIL\', \'sha256_e891...\');',
          policyRule: 'Hard ceiling: Exactly 3 touches / 7 days & 21:00-09:00 IST block',
          llmRole: 'Drafter (No state change authority)',
          table: 'outreach_messages',
        },
        {
          num: '03',
          title: 'Reply Understanding',
          status: 'Structured Intent Parsed',
          progress: '3/5',
          badge: 'UNDERSTAND',
          actor: 'Gemini LLM Parser',
          stateDelta: 'AWAITING_REPLY (Parsing)',
          summaryText: 'Debtor replies with concrete commitment date. Model parses payload into strict Zod schema with ZERO write permission.',
          evidenceLeftTitle: 'Debtor Natural Language Reply',
          evidenceLeft: '"Hi, our finance director has approved this payment. We will process ₹42,000 on Jan 10 via NEFT transfer. Thanks, Olive Trading."',
          evidenceRightTitle: 'Zod-Validated JSON Schema Output',
          evidenceRight: '{\n  "intent": "PROMISE_CANDIDATE",\n  "promised_amount": 42000.00,\n  "promised_date": "2026-01-10",\n  "confidence": 0.96,\n  "has_dispute": false,\n  "dispute_ground": null\n}\n\n/* GUARANTEE: In-memory structured output only. Zero database tools. */',
          policyRule: 'Classifications below 70% confidence route to clarification prompt',
          llmRole: 'PARSE ONLY (Zero DB write access)',
          table: 'debtor_replies',
        },
        {
          num: '04',
          title: 'Policy Decision',
          status: 'Commitment Active',
          progress: '4/5',
          badge: 'DECIDE',
          actor: 'State-Transition Service',
          stateDelta: 'AWAITING_REPLY ➔ COMMITMENT_ACTIVE',
          summaryText: 'Deterministic Policy Engine validates horizon (<=90d), acquires row-lock, and creates active commitment record.',
          evidenceLeftTitle: 'Deterministic Policy Invariants',
          evidenceLeft: '✓ Precondition 1: Promised date (Jan 10) <= 90 calendar days horizon\n✓ Precondition 2: Promised amount (₹42,000) matches 100% of reference debt\n✓ Precondition 3: No active dispute open on case',
          evidenceRightTitle: 'Atomic State-Transition Transaction',
          evidenceRight: 'BEGIN TRANSACTION;\n  -- Row lock\n  SELECT * FROM recovery_cases WHERE id = \'39fff352\' FOR UPDATE;\n\n  INSERT INTO commitments (id, case_id, amount_cents, due_date, status)\n  VALUES (\'com_912\', \'39fff352\', 4200000, \'2026-01-10\', \'ACTIVE\');\n\n  UPDATE recovery_cases\n  SET state = \'COMMITMENT_ACTIVE\'\n  WHERE id = \'39fff352\';\nCOMMIT;',
          policyRule: 'Single write path: Only StateTransitionService writes state columns',
          llmRole: 'None (Pure deterministic code)',
          table: 'commitments',
        },
        {
          num: '05',
          title: 'Outcome / Handoff',
          status: 'Debt Extinguished',
          progress: '5/5',
          badge: 'VERIFY',
          actor: 'Razorpay Webhook Callback',
          stateDelta: 'COMMITMENT_ACTIVE ➔ CLOSED_PAID',
          summaryText: 'Razorpay webhook confirms funds settlement. Commitment status advances to KEPT and case closes permanently.',
          evidenceLeftTitle: 'Razorpay Webhook Callback',
          evidenceLeft: '{\n  "event": "payment.captured",\n  "payment_id": "pay_N9xL019284",\n  "amount": 4200000,\n  "currency": "INR",\n  "status": "captured",\n  "signature_verified": true\n}',
          evidenceRightTitle: 'Terminal State Closure & Audit Trail',
          evidenceRight: 'UPDATE commitments\nSET status = \'KEPT\'\nWHERE id = \'com_912\';\n\nUPDATE recovery_cases\nSET state = \'CLOSED_PAID\'\nWHERE id = \'39fff352\';\n\n-- Append non-repudiable dual-timestamped audit\nINSERT INTO audit_events (case_id, event_type, sim_time, real_time)\nVALUES (\'39fff352\', \'case_resolved_paid\', \'2026-01-10 11:20\', NOW());',
          policyRule: '>= 90% partial payment tolerance rule satisfies full debt close',
          llmRole: 'None (Idempotent Webhook Match)',
          table: 'payments & audit_events',
        },
      ],
    },
    dispute_freeze: {
      title: 'Path B: Dispute Freeze Rule (Key Differentiator)',
      summary: 'Debtor raises an invoice line-item mismatch. Deterministic policy freezes active commitments during dispute adjudication—never deleting or voiding them.',
      stages: [
        {
          num: '01',
          title: 'Overdue Ingest',
          status: 'Case Initialized',
          progress: '1/5',
          badge: 'DETECT',
          actor: 'ERP Ingestion Engine',
          stateDelta: 'OPEN',
          summaryText: 'Invoice INV-2101 (Acme Logistics · ₹42,000) ingested with 5 billed line items.',
          evidenceLeftTitle: 'Ingested Invoice Record',
          evidenceLeft: '{\n  "invoice_id": "INV-2101",\n  "debtor": "Acme Logistics",\n  "amount_cents": 4200000,\n  "due_date": "2026-01-01",\n  "status": "OVERDUE"\n}',
          evidenceRightTitle: 'Initial State Creation',
          evidenceRight: 'INSERT INTO recovery_cases (id, state, amount_cents)\nVALUES (\'case_2101\', \'OPEN\', 4200000);\n\nINSERT INTO audit_events (case_id, event_type, actor)\nVALUES (\'case_2101\', \'case_opened\', \'SYSTEM\');',
          policyRule: 'Idempotency guaranteed via DB unique constraints',
          llmRole: 'None',
          table: 'recovery_cases',
        },
        {
          num: '02',
          title: 'Adaptive Outreach',
          status: 'Notice Dispatched',
          progress: '2/5',
          badge: 'ACT',
          actor: 'Policy Engine + Outbound Worker',
          stateDelta: 'OPEN ➔ AWAITING_REPLY',
          summaryText: 'Itemized overdue notice dispatched with payment link. Case advances to AWAITING_REPLY.',
          evidenceLeftTitle: 'Outbound Notice Copy',
          evidenceLeft: 'Subject: Invoice INV-2101 Overdue Notice\n\n"Hi Acme Logistics, invoice INV-2101 for ₹42,000 is overdue. Please find the itemized statement attached and settle via Razorpay."',
          evidenceRightTitle: 'State Cadence Update',
          evidenceRight: 'UPDATE recovery_cases\nSET state = \'AWAITING_REPLY\'\nWHERE id = \'case_2101\';',
          policyRule: 'Quiet hours enforced (21:00-09:00 IST)',
          llmRole: 'Drafter',
          table: 'outreach_messages',
        },
        {
          num: '03',
          title: 'Reply Understanding',
          status: 'Dispute Detected',
          progress: '3/5',
          badge: 'UNDERSTAND',
          actor: 'Gemini LLM Parser',
          stateDelta: 'AWAITING_REPLY (Dispute Flag)',
          summaryText: 'Debtor raises billing quantity error. Model detects dispute ground and extracts payload with ZERO write access.',
          evidenceLeftTitle: 'Debtor Dispute Message',
          evidenceLeft: '"Item #3 was billed for 10 units instead of 6. We dispute the ₹12,000 excess charge and will not pay until corrected."',
          evidenceRightTitle: 'Structured Dispute Schema Output',
          evidenceRight: '{\n  "intent": "DISPUTE",\n  "dispute_ground": "QUANTITY_BILLING_MISMATCH",\n  "disputed_line_item": 3,\n  "confidence": 0.94,\n  "has_dispute": true\n}\n\n/* Zero database writes by LLM */',
          policyRule: 'Dispute classification triggers mandatory freeze flow',
          llmRole: 'PARSE ONLY (Zero DB write access)',
          table: 'debtor_replies',
        },
        {
          num: '04',
          title: 'Policy Decision',
          status: 'Dispute Freeze Enforced',
          progress: '4/5',
          badge: 'DECIDE',
          actor: 'Deterministic Policy Engine',
          stateDelta: 'AWAITING_REPLY ➔ DISPUTE_OPEN',
          summaryText: 'Policy Engine applies Dispute-Freeze rule: active commitment is FROZEN (is_frozen = true), collection actions STOPPED.',
          evidenceLeftTitle: 'Dispute-Freeze Policy Invariants',
          evidenceLeft: '⚡ RULE: Active commitments must FREEZE (is_frozen = true), never deleted or voided.\n⚡ ACTION: Outbound automated dunning instantly halted.\n⚡ ROUTE: Case placed in Reviewer Queue for human determination.',
          evidenceRightTitle: 'Atomic State Freeze Transaction',
          evidenceRight: 'BEGIN TRANSACTION;\n  UPDATE commitments\n  SET is_frozen = TRUE\n  WHERE case_id = \'case_2101\';\n\n  UPDATE recovery_cases\n  SET state = \'DISPUTE_OPEN\'\n  WHERE id = \'case_2101\';\n\n  INSERT INTO audit_events (case_id, event_type, details)\n  VALUES (\'case_2101\', \'dispute_detected_commitment_frozen\', \'{"item":3}\');\nCOMMIT;',
          policyRule: 'Dispute-Freeze rule: commitments preserved in frozen state, not cancelled',
          llmRole: 'None (Deterministic Authority)',
          table: 'commitments & recovery_cases',
        },
        {
          num: '05',
          title: 'Outcome / Handoff',
          status: 'Human Determination',
          progress: '5/5',
          badge: 'ESCALATE',
          actor: 'Merchant Credit Reviewer',
          stateDelta: 'DISPUTE_OPEN ➔ REVISED_SETTLEMENT',
          summaryText: 'Merchant reviewer reviews audit evidence in console, validates error, issues ₹6,000 credit note, and unfreezes balance.',
          evidenceLeftTitle: 'Reviewer Console Resolution',
          evidenceLeft: 'Reviewer Action: Credit Note Issued (₹6,000)\nRevised Payable Balance: ₹36,000.00\nResolution: UNFREEZE toward revised due date',
          evidenceRightTitle: 'Unfreeze & Resolution Execution',
          evidenceRight: 'UPDATE commitments\nSET amount_cents = 3600000, is_frozen = FALSE\nWHERE case_id = \'case_2101\';\n\nINSERT INTO audit_events (case_id, event_type, actor)\nVALUES (\'case_2101\', \'human_override_dispute_resolved\', \'REVIEWER_AUTH\');',
          policyRule: 'Human review required for all disputed invoice determinations',
          llmRole: 'None (Human Reviewer Only)',
          table: 'audit_events',
        },
      ],
    },
    unresponsive: {
      title: 'Path C: Unresponsive Escalation Ladder',
      summary: 'Debtor remains silent through reminder ladder. System halts spamming at 3 touches, stops automated outreach, and escalates cleanly to collections.',
      stages: [
        {
          num: '01',
          title: 'Overdue Ingest',
          status: 'Case Initialized',
          progress: '1/5',
          badge: 'DETECT',
          actor: 'ERP Sync Worker',
          stateDelta: 'OPEN',
          summaryText: 'Invoice INV-2188 (Delta Manufacturing · ₹85,000) opened in recovery_cases.',
          evidenceLeftTitle: 'Ingested Invoice Record',
          evidenceLeft: '{\n  "invoice_id": "INV-2188",\n  "debtor": "Delta Manufacturing",\n  "amount_cents": 8500000,\n  "due_date": "2026-01-01"\n}',
          evidenceRightTitle: 'Initial Case Open',
          evidenceRight: 'INSERT INTO recovery_cases (id, state, amount_cents)\nVALUES (\'case_2188\', \'OPEN\', 8500000);',
          policyRule: 'Unique invoice reference constraint',
          llmRole: 'None',
          table: 'recovery_cases',
        },
        {
          num: '02',
          title: 'Adaptive Outreach',
          status: 'Reminder 1 Dispatched',
          progress: '2/5',
          badge: 'ACT',
          actor: 'Policy Engine',
          stateDelta: 'OPEN ➔ AWAITING_REPLY',
          summaryText: 'Initial polite reminder sent on Day 1. Zero debtor reply received after +3 days.',
          evidenceLeftTitle: 'Day 01 Outreach Record',
          evidenceLeft: 'Dispatched Touch 1 (Email + Payment Link). No debtor acknowledgement.',
          evidenceRightTitle: 'Simulated Clock Advance (+3 Days)',
          evidenceRight: 'Clock advances to Day 4.\nDebtor status: SILENT.\nTouch count: 1 / 3 touches.',
          policyRule: 'Escalation ladder: +3d before next touch attempt',
          llmRole: 'Drafter',
          table: 'outreach_messages',
        },
        {
          num: '03',
          title: 'Reply Understanding',
          status: 'Silence / No Reply',
          progress: '3/5',
          badge: 'UNDERSTAND',
          actor: 'Cadence Engine',
          stateDelta: 'AWAITING_REPLY',
          summaryText: 'Reminder 2 (+3d) and Reminder 3 (+7d) dispatched. Contact cap floor reached (3 touches in 7 days).',
          evidenceLeftTitle: 'Touch Cap Enforcement',
          evidenceLeft: 'Touch 1: Day 1\nTouch 2: Day 4\nTouch 3: Day 7\n\nTotal: 3 touches in rolling 7 days.',
          evidenceRightTitle: 'Outreach Ceased (No Spam Rule)',
          evidenceRight: '✓ Check: Touch cap reached (3 touches).\nAutomated outreach strictly halted to preserve merchant brand goodwill.',
          policyRule: 'Hard ceiling: Exactly 3 touches / 7 days',
          llmRole: 'None (Silence)',
          table: 'outreach_messages',
        },
        {
          num: '04',
          title: 'Policy Decision',
          status: 'Ghosted Determination',
          progress: '4/5',
          badge: 'DECIDE',
          actor: 'Policy Engine Stopping Rule',
          stateDelta: 'AWAITING_REPLY ➔ GHOSTED',
          summaryText: '14 calendar days elapsed with zero reply after 3 compliant touch attempts. State machine flags GHOSTED.',
          evidenceLeftTitle: '14-Day Stopping Rule Precondition',
          evidenceLeft: '✓ 14 calendar days elapsed\n✓ 3 compliant touch attempts exhausted\n✓ 0 debtor replies recorded',
          evidenceRightTitle: 'Ghosted State Transition',
          evidenceRight: 'UPDATE recovery_cases\nSET state = \'GHOSTED\'\nWHERE id = \'case_2188\';\n\n-- Automated bot shuts down cleanly',
          policyRule: 'Stopping rule: 14-day timeout transitions case to GHOSTED',
          llmRole: 'None',
          table: 'recovery_cases',
        },
        {
          num: '05',
          title: 'Outcome / Handoff',
          status: 'Collections Handoff',
          progress: '5/5',
          badge: 'ESCALATE',
          actor: 'State-Transition Service',
          stateDelta: 'GHOSTED ➔ ESCALATED',
          summaryText: 'Complete immutable audit dossier exported to collections team with dual-timestamp non-harassment proof.',
          evidenceLeftTitle: 'Structured Legal Dossier Packet',
          evidenceLeft: 'Export Package:\n- 3 dispatched notices with delivery logs\n- 14-day timestamped audit trail\n- Proof of Quiet Hours & frequency cap compliance',
          evidenceRightTitle: 'Final Case Escalation',
          evidenceRight: 'UPDATE recovery_cases\nSET state = \'ESCALATED\'\nWHERE id = \'case_2188\';\n\nINSERT INTO audit_events (case_id, event_type, details)\nVALUES (\'case_2188\', \'case_escalated_collections_handoff\', \'{"reason":"14D_NO_RESPONSE"}\');',
          policyRule: 'Audit trail bundle exported for human collections handoff',
          llmRole: 'None',
          table: 'recovery_cases & audit_events',
        },
      ],
    },
  }[activeLifecyclePath];

  const currentStage = scenarioConfig.stages[selectedStage] || scenarioConfig.stages[2];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#FDFCFB] border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono">
            Our Architecture
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-neutral-950 mt-3 tracking-[-0.015em] leading-[1.08]">
            From overdue invoice to verified recovery
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-neutral-500 mt-4 max-w-xl mx-auto leading-relaxed">
            A bounded recovery agent where the LLM interprets natural language, while deterministic policy controls every state transition.
          </p>
        </div>

        {/* 1. Compact Polished Architecture Overview */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-7 shadow-xs mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-mono">
                SYSTEM ARCHITECTURE OVERVIEW
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                End-to-end execution flow: DETECT ➔ UNDERSTAND ➔ DECIDE ➔ ACT ➔ VERIFY ➔ ESCALATE
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                LLM: PARSE ONLY
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                POLICY ENGINE: CONTROLS ACTION
              </span>
            </div>
          </div>

          {/* Architecture Node Flowchart */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {/* Node 1: Ingestion */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 relative">
              <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">01 · Ingest & Queue</div>
              <h4 className="text-xs font-bold text-neutral-900 mt-1">Invoice / Receivable</h4>
              <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                Next.js API route claims jobs via <code className="text-neutral-700 font-mono text-[10px]">SELECT FOR UPDATE SKIP LOCKED</code> queue table.
              </p>
              <div className="mt-3 pt-2 border-t border-neutral-200/60 text-[10px] font-mono text-neutral-500">
                Table: recovery_cases
              </div>
            </div>

            {/* Node 2: Intelligence Boundary */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 relative">
              <div className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">02 · Understanding</div>
              <h4 className="text-xs font-bold text-purple-950 mt-1">LLM Reply Parser</h4>
              <p className="text-[11px] text-purple-900/80 mt-1.5 leading-relaxed">
                Extracts structured promises, amounts, and dates into strict Zod schemas. <strong>Zero DB write permissions</strong>.
              </p>
              <div className="mt-3 pt-2 border-t border-purple-200/60 text-[10px] font-mono text-purple-700 font-semibold">
                Boundary: Read/Parse Only
              </div>
            </div>

            {/* Node 3: Policy Authority */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 relative">
              <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">03 · Authority Gate</div>
              <h4 className="text-xs font-bold text-blue-950 mt-1">Policy Engine + State Machine</h4>
              <p className="text-[11px] text-blue-900/80 mt-1.5 leading-relaxed">
                Sole write path (`StateTransitionService`). Enforces 90d horizons, 3/7d caps, and Dispute Freeze.
              </p>
              <div className="mt-3 pt-2 border-t border-blue-200/60 text-[10px] font-mono text-blue-700 font-semibold">
                Authority: Atomic Row Lock
              </div>
            </div>

            {/* Node 4: Outcomes */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 relative">
              <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">04 · Verification</div>
              <h4 className="text-xs font-bold text-neutral-900 mt-1">Bank Settlement / Dispute Hold</h4>
              <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                Razorpay webhooks verify settlement (`CLOSED_PAID`). Human reviewer enters only when policy requires.
              </p>
              <div className="mt-3 pt-2 border-t border-neutral-200/60 text-[10px] font-mono text-green-700 font-semibold">
                Outcome: Audit Trail Appended
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive Recovery Paths Section */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono">
                INTERACTIVE RECOVERY PATHS
              </p>
              <h3 className="text-xl font-bold text-neutral-900 mt-1 font-sans">
                Explore how the agent executes in real scenarios
              </h3>
            </div>

            {/* Path Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveLifecyclePath('clean_ptp');
                  setSelectedStage(2);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeLifecyclePath === 'clean_ptp'
                    ? 'bg-white text-blue-900 shadow-xs border border-neutral-200/80'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                PATH A — Clean Promise
              </button>

              <button
                onClick={() => {
                  setActiveLifecyclePath('dispute_freeze');
                  setSelectedStage(2);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeLifecyclePath === 'dispute_freeze'
                    ? 'bg-white text-amber-900 shadow-xs border border-neutral-200/80'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                PATH B — Dispute Freeze
              </button>

              <button
                onClick={() => {
                  setActiveLifecyclePath('unresponsive');
                  setSelectedStage(2);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeLifecyclePath === 'unresponsive'
                    ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                PATH C — Unresponsive
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* 3. Stage Stepper Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {scenarioConfig.stages.map((stage, idx) => {
                const isSelected = selectedStage === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedStage(idx)}
                    className={`text-left p-4 rounded-xl border transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-600/10'
                        : 'bg-white/80 border-neutral-200 hover:border-neutral-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        STAGE {stage.num}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {stage.progress}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                      {stage.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                      {stage.status}
                    </p>

                    <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-semibold text-neutral-400">
                        {isSelected ? '● SELECTED' : '○ Click to inspect'}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-neutral-100 text-neutral-600">
                        {stage.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 4. Detailed Evidence Panel */}
            <div className="bg-neutral-950 rounded-2xl border border-neutral-800 text-white p-6 shadow-xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                    STAGE {currentStage.num} EVIDENCE
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {currentStage.title} · <span className="text-neutral-400 font-normal text-sm">{currentStage.status}</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Actor: {currentStage.actor}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700/60 font-semibold">
                    {currentStage.stateDelta}
                  </span>
                </div>
              </div>

              {/* Summary Row */}
              <p className="text-xs text-neutral-300 mt-4 leading-relaxed font-sans">
                {currentStage.summaryText}
              </p>

              {/* Split Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 font-mono text-xs">
                {/* Left: Inbound Signal / Payload */}
                <div className="bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] text-neutral-400">
                    <span className="font-sans font-semibold text-neutral-200">{currentStage.evidenceLeftTitle}</span>
                    <span className="text-[10px] text-purple-400 font-mono">LLM: {currentStage.llmRole}</span>
                  </div>
                  <pre className="text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed text-[11px]">
                    {currentStage.evidenceLeft}
                  </pre>
                </div>

                {/* Right: Deterministic Policy & Atomic Write */}
                <div className="bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] text-neutral-400">
                    <span className="font-sans font-semibold text-blue-300">{currentStage.evidenceRightTitle}</span>
                    <span className="text-[10px] text-green-400 font-semibold font-mono">ACID Lock Verified</span>
                  </div>
                  <pre className="text-blue-200/90 font-mono whitespace-pre-wrap leading-relaxed text-[11px]">
                    {currentStage.evidenceRight}
                  </pre>
                </div>
              </div>

              {/* Guardrails Callout Bar */}
              <div className="mt-5 pt-3.5 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300 text-[11px] font-mono">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>{currentStage.policyRule}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-mono">
                    <Database className="w-3 h-3 text-neutral-400" />
                    <span>Table: {currentStage.table}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                  <span>Dual Timestamps ✓</span>
                  <span>Zero DB Writes by LLM ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
