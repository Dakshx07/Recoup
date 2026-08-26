export function GuardrailsSection() {
  return (
    <section id="guardrails" className="py-20 md:py-28 bg-[#FDFCFB] border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono">
            Hardcoded Policy Rules
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-neutral-950 mt-3 tracking-[-0.015em] leading-[1.08]">
            13 Locked Constants in Policy Engine
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-neutral-500 mt-4 max-w-xl mx-auto leading-relaxed">
            Zero inline numbers. Every threshold governing communication, validation, and escalation is an auditable constant locked in <code className="text-neutral-800 font-mono text-[11px] bg-neutral-200/60 px-1.5 py-0.5 rounded border border-neutral-300/60">domain/policy-engine/config.ts</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Rule 1: Quiet Hours */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    TEMPORAL GATE
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  21:00–09:00 IST
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-3">
                Quiet Hours Block
              </h3>
              <code className="block text-[10.5px] font-mono text-neutral-500 mt-1">
                QUIET_HOURS_START_IST = 21
              </code>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Zero outbound debtor messages dispatched during evening and night hours. Outreach automatically queues in memory until the 09:00 IST window opens.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Deterministic Check</span>
              <span className="text-green-700 font-semibold">Strict Invariant ✓</span>
            </div>
          </div>

          {/* Rule 2: Contact Frequency Cap */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    FREQUENCY CEILING
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  3 touches / 7 days
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-3">
                Anti-Harassment Ceiling
              </h3>
              <code className="block text-[10.5px] font-mono text-neutral-500 mt-1">
                MAX_TOUCHES_PER_WINDOW = 3
              </code>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Hard ceiling on communication touches per rolling 7-day window. Eliminates repetitive dunning and preserves debtor trust and brand goodwill.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Rolling 7-Day Window</span>
              <span className="text-green-700 font-semibold">Zero Spam Rule ✓</span>
            </div>
          </div>

          {/* Rule 3: Promise Horizon */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    CREDIT POLICY
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  90 Days Max
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-3">
                Max Promise Horizon
              </h3>
              <code className="block text-[10.5px] font-mono text-neutral-500 mt-1">
                MAX_PROMISE_HORIZON_DAYS = 90
              </code>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Promises extending beyond 90 calendar days are rejected by deterministic policy and routed directly to merchant console reviewers for human credit authorization.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Calculated from Due Date</span>
              <span className="text-green-700 font-semibold">Credit Guard ✓</span>
            </div>
          </div>

          {/* Rule 4: Partial Payment Tolerance */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    RECONCILIATION
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200">
                  &ge; 90% Settles Full
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-3">
                Partial Payment Tolerance
              </h3>
              <code className="block text-[10.5px] font-mono text-neutral-500 mt-1">
                PARTIAL_PAYMENT_TOLERANCE_PCT = 90
              </code>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Settlements meeting 90% threshold transition to <code className="text-neutral-800 font-mono text-[10.5px]">CLOSED_PARTIAL</code> (KEPT) without triggering erroneous broken-promise escalations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Webhook Reconciled</span>
              <span className="text-green-700 font-semibold">Zero False Break ✓</span>
            </div>
          </div>

          {/* Rule 5: Escalation Ladder */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    LADDER CADENCE
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  +3d &rarr; +7d &rarr; Day 14
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-3">
                Cadence Ladder & Timeout
              </h3>
              <code className="block text-[10.5px] font-mono text-neutral-500 mt-1">
                GHOSTED_TIMEOUT_DAYS = 14
              </code>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Progression from Reminder 2 (+3d) to Reminder 3 (+7d) to Collections Handoff if debtor remains completely unresponsive after 14 calendar days.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Predictable Ladder</span>
              <span className="text-green-700 font-semibold">Automated Stop ✓</span>
            </div>
          </div>

          {/* Rule 6: Dispute-Freeze Rule */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    DISPUTE PRESERVATION
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Frozen, Not Cancelled
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-3">
                Dispute-Freeze Invariant
              </h3>
              <code className="block text-[10.5px] font-mono text-neutral-500 mt-1">
                is_frozen = TRUE
              </code>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Disputed commitments enter frozen hold state (<code className="text-neutral-800 font-mono text-[10.5px]">is_frozen = true</code>), preserving original dates until human dispute determination in merchant console.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Key Differentiator</span>
              <span className="text-amber-800 font-semibold">Never Voided ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
