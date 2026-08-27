import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { RecoupLogo } from '@/components/ui/logo';

export function Footer() {
  return (
    <footer className="py-12 bg-white text-xs text-neutral-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-200">
          {/* Logo and Tagline */}
          <div className="flex items-center gap-3">
            <RecoupLogo size={28} className="w-7 h-7" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900 text-sm">Recoup</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                  Autonomous Recovery Agent
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Two-tier state machine with 0 DB write permissions for LLMs
              </p>
            </div>
          </div>

          {/* Quick Links with Highlighted GitHub Badge */}
          <div className="flex flex-wrap items-center justify-center gap-5 font-medium text-neutral-600">
            <Link href="/app" className="hover:text-neutral-900 transition-colors">Console</Link>
            <Link href="/app/policy" className="hover:text-neutral-900 transition-colors">Policy Engine</Link>
            <Link href="/app/evaluation" className="hover:text-neutral-900 transition-colors">Benchmark</Link>
            <Link href="/app/simulation" className="hover:text-neutral-900 transition-colors">Simulation</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-black font-semibold text-xs transition-all shadow-xs hover:shadow group cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Specs</span>
              <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-400 font-mono">
          <span>© 2026 Recoup · Built for Razorpay AI Buildathon</span>
          <span>Deterministic Policy Authority · Immutable PostgreSQL Audit Trail</span>
        </div>
      </div>
    </footer>
  );
}
