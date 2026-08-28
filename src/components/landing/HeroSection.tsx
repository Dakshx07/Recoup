import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-24 pb-12 md:pt-28 md:pb-16 bg-gradient-to-b from-[#FAF9F7] via-[#FDFCFB] to-white border-b border-neutral-200/70 overflow-hidden">
      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 shadow-2xs mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[11px] font-medium text-neutral-600 tracking-tight">
            Razorpay AI Buildathon 2026 · Autonomous Recovery Infrastructure
          </span>
        </div>

        {/* Caacupé One Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] font-normal text-neutral-950 tracking-[-0.015em] leading-[1.06] max-w-4xl mx-auto">
          Every promise to pay, <br className="hidden sm:inline" />
          <span className="text-blue-700 font-serif">tracked, verified,</span> and provable.
        </h1>

        {/* Small Crisp Subhead */}
        <p className="text-xs sm:text-sm md:text-sm text-neutral-500 max-w-lg mx-auto mt-4 leading-relaxed font-normal">
          An autonomous recovery agent for Razorpay merchants that replaces blind dunning emails with verified debtor commitments, deterministic dispute freezing, and immutable audit logs.
        </p>

        {/* Refined Small CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-6">
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition-all shadow-2xs hover:shadow active:scale-98 cursor-pointer"
          >
            <span>Launch Operations Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="#audit-trail"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs sm:text-sm font-medium hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-2xs cursor-pointer"
          >
            <span>Inspect Case Decision Trail</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        </div>

        {/* Live Evaluator Cue */}
        <p className="text-[13px] text-neutral-500 mt-3 font-mono">
          Live console includes interactive <span className="text-blue-700 font-bold">Razorpay Test Mode</span> checkout &amp; webhook verification
        </p>

        {/* Credibility Metric Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-10 text-left">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">Recovery Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-950 font-mono mt-0.5">40.12%</p>
            <p className="text-[11px] text-green-700 font-medium mt-0.5">₹50.06L in 200-case simulation</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">Dispute Accuracy</p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-950 font-mono mt-0.5">100.0%</p>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">Deterministic freeze rule</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">Model Permission</p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-950 font-mono mt-0.5">0 Tools</p>
            <p className="text-[11px] text-neutral-600 font-medium mt-0.5">Zero DB write access</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">Ledger Type</p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-950 font-mono mt-0.5">Append-Only</p>
            <p className="text-[11px] text-neutral-600 font-medium mt-0.5">Dual-timestamped audit</p>
          </div>
        </div>
      </div>
    </section>
  );
}
