export function BenchmarkSection() {
  return (
    <section id="evaluation" className="py-20 md:py-28 bg-[#FDFCFB] border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono">
            Measured Empirical Benchmark
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-neutral-950 mt-3 tracking-[-0.015em] leading-[1.08]">
            Evaluated across 200 overdue enterprise invoices
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-neutral-500 mt-4 max-w-xl mx-auto leading-relaxed">
            Full-lifecycle simulation across 8 distinct debtor behavioral scenarios with deterministic Policy Engine enforcement and zero LLM write permissions.
          </p>
        </div>

        {/* Benchmark Measured Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">Invoiced Book</p>
            <p className="text-2xl font-bold text-neutral-950 font-mono mt-1">₹1.25 Cr</p>
            <p className="text-xs text-neutral-400 mt-1 font-mono">₹1,24,77,150 across 200 cases</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">Capital Recovered</p>
            <p className="text-2xl font-bold text-green-700 font-mono mt-1">₹50.06 L</p>
            <p className="text-xs text-neutral-400 mt-1 font-mono">₹50,05,977 extinguished debt</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">Capital Recovery Rate</p>
            <p className="text-2xl font-bold text-blue-700 font-mono mt-1">40.12%</p>
            <p className="text-xs text-neutral-400 mt-1 font-mono">80 of 200 cases settled (40.0%)</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">Freeze Adherence</p>
            <p className="text-2xl font-bold text-neutral-950 font-mono mt-1">100.0%</p>
            <p className="text-xs text-neutral-400 mt-1 font-mono">0 wrongful promise cancellations</p>
          </div>
        </div>

        {/* Progress Breakdown Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Portfolio Capital Settlement Distribution
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Direct aggregation from PostgreSQL invoices and commitments ledger
              </p>
            </div>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700">
              N = 200 Simulated Invoices
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-neutral-700">Recovered Debt (Extinguished)</span>
                <span className="text-neutral-900 font-mono font-semibold">₹50,05,977 (40.12%)</span>
              </div>
              <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '40.12%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-neutral-700">Outstanding Active & Escalated Balance</span>
                <span className="text-neutral-900 font-mono font-semibold">₹74,71,173 (59.88%)</span>
              </div>
              <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-400 rounded-full" style={{ width: '59.88%' }} />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500 border-t border-neutral-100">
            <span>Clean Promise Honor: <strong className="text-neutral-900 font-mono">100%</strong> (60/60)</span>
            <span>Dispute Human Review Queue: <strong className="text-neutral-900 font-mono">20%</strong> (40/200)</span>
            <span>LLM Schema Validity: <strong className="text-neutral-900 font-mono">100%</strong> (180/180)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
