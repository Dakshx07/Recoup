import { AlertTriangle } from 'lucide-react';

export function ProblemSection() {
  return (
    <section id="problem" aria-labelledby="problem-heading" className="py-20 md:py-28 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600 font-mono">
            The Industry Blindspot
          </p>
          <h2 id="problem-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-neutral-950 mt-3 tracking-[-0.015em] leading-[1.08]">
            Reminders get sent. Promises get made. <br />
            <span className="text-neutral-600 font-serif">Nobody tracks which ones get kept.</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-neutral-600 mt-4 leading-relaxed max-w-xl mx-auto">
            Legacy dunning tools operate on blind email cadences. When a debtor replies with a commitment date or flags a dispute, traditional automation fails silently.
          </p>
        </div>

        {/* 3 Visual Failure Scenario Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left mt-14">
          {/* Scenario 1 */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-red-100 text-red-700 font-mono font-bold text-xs flex items-center justify-center">
                    01
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-mono">
                    Blind Cadence
                  </span>
                </div>
                <span className="text-[11px] text-neutral-600 font-mono">Timer-Driven</span>
              </div>

              <h3 className="text-base font-bold text-neutral-900">The Broadcast Black Hole</h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                Legacy systems fire automated emails every 3 days. They cannot parse reply intent or verify settlement claims.
              </p>

              {/* Micro UI: Failed Sequence */}
              <div className="mt-5 space-y-2 bg-white p-3 rounded-xl border border-neutral-200/80 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 text-neutral-600">
                  <span>Day 01 · Automated Notice</span>
                  <span className="text-[10px] text-neutral-500 font-medium">Sent</span>
                </div>
                <div className="p-2 rounded bg-neutral-50 text-neutral-700 font-sans text-xs">
                  <span className="font-semibold text-neutral-900">Debtor:</span> &ldquo;Checking invoice with accounts...&rdquo;
                </div>
                <div className="flex items-center gap-1.5 text-red-600 bg-red-50/70 p-2 rounded border border-red-100/70 font-sans text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                  <span><strong>Day 04:</strong> Bot sends generic reminder anyway (Reply ignored)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-600">
              <span>Result:</span>
              <span className="font-medium text-red-600 font-mono">Spam flag · Zero attribution</span>
            </div>
          </div>

          {/* Scenario 2 */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-mono font-bold text-xs flex items-center justify-center">
                    02
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">
                    Context Loss
                  </span>
                </div>
                <span className="text-[11px] text-neutral-600 font-mono">No State Store</span>
              </div>

              <h3 className="text-base font-bold text-neutral-900">Commitment Amnesia</h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                Debtors promise to pay on a specific date. Without an active commitment ledger, legacy bots keep nagging beforehand.
              </p>

              {/* Micro UI: Broken Promise Flow */}
              <div className="mt-5 space-y-2 bg-white p-3 rounded-xl border border-neutral-200/80 font-sans text-xs">
                <div className="p-2 rounded bg-blue-50/60 border border-blue-100/60 text-blue-950">
                  <div className="flex items-center justify-between text-[10px] font-mono text-blue-600 font-semibold mb-0.5">
                    <span>INBOUND PROMISE</span>
                    <span>Jan 03</span>
                  </div>
                  <p className="text-xs">&ldquo;We will process ₹42,000 on Jan 10 via NEFT.&rdquo;</p>
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-900">
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-700 font-semibold mb-0.5">
                    <span>LEGACY BOT (Jan 05)</span>
                    <span className="text-red-600 font-semibold">Premature</span>
                  </div>
                  <p className="text-xs">&ldquo;⚠️ URGENT: Your payment is 5 days overdue!&rdquo;</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-600">
              <span>Result:</span>
              <span className="font-medium text-amber-700 font-mono">Customer goodwill destroyed</span>
            </div>
          </div>

          {/* Scenario 3 */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 font-mono font-bold text-xs flex items-center justify-center">
                    03
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 font-mono">
                    Dispute Void
                  </span>
                </div>
                <span className="text-[11px] text-neutral-600 font-mono">Binary Rules</span>
              </div>

              <h3 className="text-base font-bold text-neutral-900">False-Escalation Waves</h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                Legitimate line-item disputes get escalated straight to collections handoffs because simple rules can&apos;t freeze a case.
              </p>

              {/* Micro UI: Dispute Escalation Error */}
              <div className="mt-5 space-y-2 bg-white p-3 rounded-xl border border-neutral-200/80 font-sans text-xs">
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200 text-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-500 font-semibold block mb-0.5">LINE-ITEM DISPUTE</span>
                  <p className="text-xs">&ldquo;Quantity mismatch on Item #3. Please revise invoice.&rdquo;</p>
                </div>
                <div className="p-2 rounded bg-red-50 border border-red-100 text-red-900">
                  <div className="flex items-center justify-between text-[10px] font-mono text-red-700 font-semibold mb-0.5">
                    <span>LEGACY HANDOFF</span>
                    <span className="text-red-700 font-semibold">Wrongful Action</span>
                  </div>
                  <p className="text-xs">Account flagged for external legal collections</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-600">
              <span>Result:</span>
              <span className="font-medium text-neutral-800 font-mono">Merchant churn & legal cost</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
