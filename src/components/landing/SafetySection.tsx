'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2, Shield, Lock } from 'lucide-react';

export function SafetySection() {
  const [activeSafetyTab, setActiveSafetyTab] = useState<number>(0);

  const safetyData = [
    {
      title: 'Promise to Pay Intake & Commitment Registration',
      aiRole: 'Extracts date & amount into strict Zod schema',
      aiPayloadTitle: 'LLM In-Memory Schema Output (Zero DB Access)',
      aiPayload: '{\n  "intent": "PROMISE_CANDIDATE",\n  "promised_amount": 42000.00,\n  "promised_date": "2026-01-10",\n  "confidence": 0.96,\n  "has_dispute": false\n}',
      aiBadge: 'PERMITTED: Structured JSON Output',
      policyRole: 'Enforces <=90d horizon & acquires row lock to commit',
      policyPayloadTitle: 'State-Transition Service (Atomic Begin)',
      policyPayload: 'BEGIN TRANSACTION;\n  SELECT * FROM recovery_cases\n  WHERE id = \'39fff352\' FOR UPDATE;\n\n  INSERT INTO commitments (case_id, amount_cents, due_date, status)\n  VALUES (\'39fff352\', 4200000, \'2026-01-10\', \'ACTIVE\');\n\n  UPDATE recovery_cases\n  SET state = \'COMMITMENT_ACTIVE\'\n  WHERE id = \'39fff352\';\nCOMMIT;',
      policyBadge: 'SOLE WRITE AUTHORITY: ACID Serialized',
    },
    {
      title: 'Dispute Detection & Active Commitment Freeze',
      aiRole: 'Detects line-item dispute ground with zero delete powers',
      aiPayloadTitle: 'LLM Dispute Schema Output',
      aiPayload: '{\n  "intent": "DISPUTE",\n  "dispute_ground": "QUANTITY_BILLING_MISMATCH",\n  "disputed_line_item": 3,\n  "confidence": 0.94,\n  "has_dispute": true\n}',
      aiBadge: 'UNPRIVILEGED: Cannot Modify Database',
      policyRole: 'Applies Dispute Freeze (is_frozen = true) & halts bot',
      policyPayloadTitle: 'Atomic State Freeze Transaction',
      policyPayload: 'BEGIN TRANSACTION;\n  -- Commitments are FROZEN, never voided or deleted\n  UPDATE commitments\n  SET is_frozen = TRUE\n  WHERE case_id = \'case_2101\';\n\n  UPDATE recovery_cases\n  SET state = \'DISPUTE_OPEN\'\n  WHERE id = \'case_2101\';\nCOMMIT;',
      policyBadge: 'RULE ENFORCED: is_frozen = true',
    },
    {
      title: 'Adaptive Outreach Drafting vs Compliance Gate',
      aiRole: 'Drafts contextual follow-up using brand voice',
      aiPayloadTitle: 'Generated Outreach Draft',
      aiPayload: 'Subject: Invoice INV-2041 Overdue Notice\n\n"Hi Olive Trading team, payment of ₹42,000 was due Jan 1. Please process using your secure link: https://rzp.io/i/rec_2041 or let us know if you need assistance."',
      aiBadge: 'DRAFTER ONLY: Cannot Send Directly',
      policyRole: 'Evaluates Quiet Hours (21:00-09:00 IST) and 3-touch cap',
      policyPayloadTitle: 'Outreach Policy Gate Verification',
      policyPayload: '✓ Check: Current time is 11:30 IST (Outside Quiet Hours)\n✓ Check: 0 touches in rolling 7 days (Limit: 3/7d)\n\nUPDATE recovery_cases\nSET state = \'AWAITING_REPLY\'\nWHERE id = \'39fff352\';\n\nINSERT INTO outreach_messages (case_id, channel, body_hash)\nVALUES (\'39fff352\', \'EMAIL\', \'sha256_82f1...\');',
      policyBadge: 'COMPLIANCE GATE: 3 Touches & Quiet Hours',
    },
    {
      title: 'Ambiguity Flagging vs Human Adjudication Queue',
      aiRole: 'Calculates per-call confidence and detects ambiguity',
      aiPayloadTitle: 'Low-Confidence Ambiguous Extraction',
      aiPayload: '{\n  "intent": "AMBIGUOUS",\n  "confidence": 0.42,\n  "notes": "Debtor text unclear regarding payment timeframe.",\n  "requires_human": true\n}',
      aiBadge: 'FALLBACK: Confidence < 70% Flags Review',
      policyRole: 'Prevents state corruption and queues case for console review',
      policyPayloadTitle: 'Human Review Queue Transaction',
      policyPayload: 'UPDATE recovery_cases\nSET state = \'HUMAN_REVIEW_REQUIRED\',\n    review_reason = \'LOW_CONFIDENCE_AMBIGUITY\'\nWHERE id = \'39fff352\';\n\nINSERT INTO audit_events (case_id, event_type, actor)\nVALUES (\'39fff352\', \'escalated_for_human_review\', \'POLICY_ENGINE\');',
      policyBadge: 'AUDIT LOGGED: Dual Timestamp Invariant',
    },
  ][activeSafetyTab];

  return (
    <section id="ai-boundary" className="py-20 md:py-28 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono">
            Architectural Safety
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-neutral-950 mt-3 tracking-[-0.015em] leading-[1.08]">
            AI proposes. The Policy Engine decides.
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-neutral-500 mt-4 leading-relaxed max-w-xl mx-auto">
            We do not give LLMs database write access or tool execution powers. The model operates solely as a schema-constrained structured output parser.
          </p>
        </div>

        {/* Interactive Guarantee Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 0, label: '01 · Intent Parsing vs State Write' },
            { id: 1, label: '02 · Dispute Freeze vs Preservation' },
            { id: 2, label: '03 · Outreach Drafting vs Quiet Hours' },
            { id: 3, label: '04 · Confidence Gate vs Human Handoff' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSafetyTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSafetyTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 border border-neutral-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* Two-Tier Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Intelligence Tier (LLM) */}
            <div className="bg-purple-50/40 rounded-2xl border border-purple-200/90 p-6 md:p-7 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-purple-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider font-mono">
                        Intelligence Layer (LLM)
                      </h3>
                      <span className="text-[11px] text-purple-700 font-medium">
                        Gemini 2.5 Flash Structured Parser
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    READ / PARSE ONLY
                  </span>
                </div>

                {/* Capabilities Checklist */}
                <ul className="space-y-2.5 mt-5 text-xs text-purple-900/90 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Classifies Inbound Intent</strong> — Detects promise candidates, dispute grounds, or ambiguity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Extracts Structured Payloads</strong> — Pulls payment amounts and dates into strict Zod schemas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Calculates Per-Call Confidence</strong> — Flags classifications &lt; 70% confidence for clarification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Drafts Outreach Copy</strong> — Tailors professional follow-ups using merchant brand voice.</span>
                  </li>
                </ul>

                {/* Code / In-Memory Payload Sandbox */}
                <div className="mt-5 bg-neutral-900 text-white p-4 rounded-xl border border-neutral-800 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] text-neutral-400 font-sans">
                    <span className="font-semibold text-neutral-200">{safetyData.aiPayloadTitle}</span>
                    <span className="text-[10px] text-purple-400 font-mono">0 DB Tools</span>
                  </div>
                  <pre className="text-purple-200/90 whitespace-pre-wrap leading-relaxed text-[11px]">
                    {safetyData.aiPayload}
                  </pre>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center justify-between text-[11px] font-mono text-purple-800">
                <span>✓ {safetyData.aiBadge}</span>
                <span className="text-neutral-500">Zero DB writes</span>
              </div>
            </div>

            {/* Right: Authority Tier (Policy Engine) */}
            <div className="bg-blue-50/30 rounded-2xl border border-blue-200/90 p-6 md:p-7 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-mono">
                        Authority Layer (Policy Engine)
                      </h3>
                      <span className="text-[11px] text-blue-700 font-medium">
                        Deterministic StateTransitionService
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    SOLE WRITE AUTHORITY
                  </span>
                </div>

                {/* Authority Checklist */}
                <ul className="space-y-2.5 mt-5 text-xs text-neutral-700 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Sole State-Transition Authority</strong> — Only <code className="text-neutral-900 bg-white px-1 py-0.5 rounded border border-neutral-200 font-mono text-[10.5px]">StateTransitionService</code> writes state columns.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Enforces Dispute-Freeze Rule</strong> — Freezes commitments (<code className="text-neutral-900 bg-white px-1 py-0.5 rounded border border-neutral-200 font-mono text-[10.5px]">is_frozen = true</code>); never voids them.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Hardcoded 13 Business Constants</strong> — Enforces 21:00-09:00 IST Quiet Hours, 3/7d caps, and 90d horizons.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Immutable Audit Recording</strong> — Appends every state delta with actor attribution and dual timestamps.</span>
                  </li>
                </ul>

                {/* Code / Atomic Transaction Sandbox */}
                <div className="mt-5 bg-neutral-900 text-white p-4 rounded-xl border border-neutral-800 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] text-neutral-400 font-sans">
                    <span className="font-semibold text-blue-300">{safetyData.policyPayloadTitle}</span>
                    <span className="text-[10px] text-green-400 font-mono">Row Lock</span>
                  </div>
                  <pre className="text-blue-200/90 whitespace-pre-wrap leading-relaxed text-[11px]">
                    {safetyData.policyPayload}
                  </pre>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-[11px] font-mono text-blue-900">
                <span>✓ {safetyData.policyBadge}</span>
                <span className="text-neutral-500">Atomic Postgres Lock</span>
              </div>
            </div>
          </div>

          {/* Bottom Architectural Guarantees Strip */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200/80 p-4 flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-neutral-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Zero Unchecked DB Mutations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>In-Memory Zod Schema Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>ACID Row-Level Locking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Dual Timestamps Audit Trail</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
