import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function AuditLedgerSection() {
  return (
    <section id="audit-trail" className="py-20 md:py-28 bg-white border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono">
            Live Product Proof
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-neutral-950 mt-3 tracking-[-0.015em] leading-[1.08]">
            An immutable decision ledger for every case
          </h2>
          <p className="text-xs sm:text-sm md:text-sm text-neutral-500 mt-4 max-w-xl mx-auto leading-relaxed">
            The 7-step causal chain for Case INV-2101 (Olive Trading) showing inbound replies, LLM structured intent extractions, deterministic Policy Engine gating, and the Dispute-Freeze rule in action.
          </p>
        </div>

        {/* Browser Chrome Container */}
        <div className="rounded-2xl border border-neutral-300 bg-white shadow-xl overflow-hidden">
          <div className="bg-neutral-100 px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
              <span className="text-xs font-mono text-neutral-500 ml-2">recoup.internal/app/cases/39fff352...</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span className="px-2 py-0.5 rounded bg-neutral-200/80 text-neutral-700 text-[10.5px]">
                SIMULATED REPLAY
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                DISPUTE_OPEN
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                INV-2101 · ₹42,000
              </span>
            </div>
          </div>

          {/* Audit Chain View */}
          <div className="p-6 bg-neutral-50/50 space-y-3.5 font-mono text-xs">
            <div className="bg-white p-4 rounded-xl border border-neutral-200/90 flex items-start justify-between shadow-2xs">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 font-bold">SYSTEM</span>
                <span className="text-neutral-400 mx-1.5">·</span>
                <span className="font-semibold text-neutral-800">case_opened</span>
                <p className="text-neutral-600 mt-1 font-sans text-xs">Case opened for INV-2101 (Olive Trading) — ₹42,000 overdue</p>
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                <p>Jan 1, 2026 · 11:19 AM</p>
                <p className="text-neutral-400">Real: 2026-08-25 UTC</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200/90 flex items-start justify-between shadow-2xs">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 font-bold">SYSTEM</span>
                <span className="text-neutral-400 mx-1.5">·</span>
                <span className="font-semibold text-neutral-800">debtor_reply_received</span>
                <p className="text-neutral-600 mt-1 font-sans text-xs">&ldquo;We will process payment of ₹42,000 by Jan 10.&rdquo;</p>
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                <p>Jan 3, 2026 · 11:19 AM</p>
                <p className="text-neutral-400">Real: 2026-08-25 UTC</p>
              </div>
            </div>

            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 flex items-start justify-between shadow-2xs">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-bold">LLM PARSER</span>
                <span className="text-purple-300 mx-1.5">·</span>
                <span className="font-semibold text-purple-900">reply_parsed (PROMISE_CANDIDATE)</span>
                <p className="text-purple-800 mt-1 font-sans text-xs">Structured extraction: ₹42,000 due 2026-01-10 (Confidence: 95.2%)</p>
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                <p>Jan 3, 2026 · 11:20 AM</p>
                <p className="text-neutral-400">Real: 2026-08-25 UTC</p>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex items-start justify-between shadow-2xs">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">POLICY ENGINE</span>
                <span className="text-blue-300 mx-1.5">·</span>
                <span className="font-semibold text-blue-900">commitment_validated</span>
                <p className="text-blue-800 mt-1 font-sans text-xs">Promise registered for ₹42,000 &rarr; State advanced to COMMITMENT_ACTIVE</p>
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                <p>Jan 3, 2026 · 11:21 AM</p>
                <p className="text-neutral-400">Real: 2026-08-25 UTC</p>
              </div>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-start justify-between shadow-2xs">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">POLICY ENGINE</span>
                <span className="text-amber-400 mx-1.5">·</span>
                <span className="font-semibold text-amber-950">dispute_detected_commitment_frozen</span>
                <p className="text-amber-900 mt-1 font-sans text-xs">Active commitment FROZEN (preserved, not cancelled) per Dispute-Freeze rule. Case moved to DISPUTE_OPEN.</p>
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                <p>Jan 5, 2026 · 11:21 AM</p>
                <p className="text-neutral-400">Real: 2026-08-25 UTC</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-500 font-sans">
              Dual timestamps enforce non-repudiation across simulated clock and physical UTC time.
            </span>
            <Link
              href="/app/cases/39fff352-9878-4b2e-a8cc-b1f45407f85c"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>View live in console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
