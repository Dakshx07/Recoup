import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

export function FinalCtaSection() {
  return (
    <section className="py-20 md:py-28 bg-neutral-950 text-white border-b border-neutral-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 mb-6 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>Razorpay AI Buildathon 2026</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal tracking-[-0.015em] text-white leading-[1.08]">
          Built for how recovery already works <br className="hidden sm:inline" />
          <span className="text-blue-400 font-serif">at Razorpay&apos;s scale.</span>
        </h2>

        <p className="text-xs sm:text-sm md:text-sm text-neutral-400 max-w-xl mx-auto mt-4 leading-relaxed font-sans">
          Eliminate revenue leakage, protect debtor relationships, and prove mathematical policy adherence on every overdue invoice.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <span>Explore Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/app/simulation"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 hover:text-white transition-all shadow-xs cursor-pointer"
          >
            <span>Launch Clock Simulator</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
