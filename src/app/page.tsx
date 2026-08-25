'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Sparkles,
  CheckCircle2,
  Lock,
  Clock,
  Zap,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  Database,
  ExternalLink,
  Code2,
  Scale,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'policy' | 'evaluation'>('architecture');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* 1. Persistent Sticky Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-md border-b border-neutral-200/80 shadow-xs py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                R
              </div>
              <span className="font-bold text-lg tracking-tight text-neutral-900">
                Recoup
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                AI Recovery Agent
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600">
              <a href="#problem" className="hover:text-neutral-900 transition-colors">The Problem</a>
              <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">How It Works</a>
              <a href="#ai-boundary" className="hover:text-neutral-900 transition-colors">AI Boundary</a>
              <a href="#guardrails" className="hover:text-neutral-900 transition-colors">Guardrails</a>
              <a href="#audit-trail" className="hover:text-neutral-900 transition-colors">Audit Ledger</a>
              <a href="#evaluation" className="hover:text-neutral-900 transition-colors">Benchmark</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Specs & ADRs</span>
            </a>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm hover:shadow active:scale-95"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section — Atmospheric Convergence Motif */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden border-b border-neutral-200/60">
        {/* Hero Background Image with Subtle Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply">
          <Image
            src="/hero.png"
            alt="Convergence Metaphor"
            fill
            priority
            className="object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDFCFB]/40 via-transparent to-[#FDFCFB]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-neutral-200/80 shadow-xs mb-6 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-medium text-neutral-700 tracking-tight">
              Razorpay AI Buildathon 2026 · Autonomous Recovery Infrastructure
            </span>
          </div>

          {/* Fraunces Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-neutral-950 tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Every promise to pay, <br className="hidden sm:inline" />
            <span className="italic font-serif text-blue-900">tracked, verified,</span> and provable.
          </h1>

          {/* Subhead */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
            An autonomous recovery agent for Razorpay merchants that replaces blind dunning emails with verified debtor commitments, deterministic dispute freezing, and immutable audit logs.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-9">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              <span>Launch Operations Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#audit-trail"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-neutral-300 text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-all shadow-xs"
            >
              <span>Inspect Case Decision Trail</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </a>
          </div>

          {/* Credibility Metric Chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-14 pt-8 border-t border-neutral-200/80 text-left">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-lg border border-neutral-200/70 shadow-2xs">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Recovery Lift</p>
              <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">+26.4 pts</p>
              <p className="text-[11px] text-green-700 font-medium">vs static 3-touch dunning</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-lg border border-neutral-200/70 shadow-2xs">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Dispute Accuracy</p>
              <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">100.0%</p>
              <p className="text-[11px] text-blue-700 font-medium">Deterministic freeze rule</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-lg border border-neutral-200/70 shadow-2xs">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Model Permission</p>
              <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">0 Tools</p>
              <p className="text-[11px] text-neutral-600 font-medium">Zero database write access</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-lg border border-neutral-200/70 shadow-2xs">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Ledger Type</p>
              <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">Append-Only</p>
              <p className="text-[11px] text-neutral-600 font-medium">Dual-timestamped audit</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Problem — Clean Typographic Contrast Beat */}
      <section id="problem" className="py-20 md:py-28 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            The Industry Blindspot
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-neutral-950 mt-3 tracking-tight leading-tight">
            Reminders get sent. Promises get made. <br />
            <span className="italic font-serif text-neutral-500">Nobody tracks which ones get kept.</span>
          </h2>
          <p className="text-base text-neutral-600 mt-6 leading-relaxed max-w-2xl mx-auto">
            Traditional dunning tools treat debt recovery as an email broadcast schedule. When a customer replies with a payment promise or disputes a line item, the automation fails silently.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-14">
            <div className="p-5 rounded-lg border border-neutral-200 bg-neutral-50/60">
              <div className="w-8 h-8 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs mb-3.5">
                01
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">The Broadcast Black Hole</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Legacy systems blast automated emails every 3 days. They cannot parse intent, verify payment claims, or hold cadence when a real promise is given.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-neutral-200 bg-neutral-50/60">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mb-3.5">
                02
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Commitment Amnesia</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Debtors say &ldquo;I will pay on the 10th.&rdquo; Without an active commitment ledger, the bot continues nagging them on the 5th, destroying customer goodwill.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-neutral-200 bg-neutral-50/60">
              <div className="w-8 h-8 rounded bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs mb-3.5">
                03
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">False-Escalation Waves</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Disputed invoices get escalated straight to collections handoffs because rules engines can&apos;t freeze a promise without accidentally cancelling it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works — 5-Stage Causal Arc */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#FDFCFB] border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Lifecycle Arc
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950 mt-2 tracking-tight">
              From overdue notice to verified bank settlement
            </h2>
            <p className="text-sm text-neutral-600 mt-3">
              A closed-loop state machine where every transition is validated by policy rules and backed by financial proof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs relative">
              <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider mb-2">Stage 01</div>
              <h3 className="text-sm font-bold text-neutral-900">Overdue Ingestion</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Invoices syncing from merchant ERPs open a dedicated recovery case with immutable reference amounts.
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                <Database className="w-3 h-3 text-neutral-400" />
                <span>recovery_cases</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs relative">
              <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider mb-2">Stage 02</div>
              <h3 className="text-sm font-bold text-neutral-900">Adaptive Outreach</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Multi-channel email/WhatsApp drafts generated contextually, strictly respecting Quiet Hours & 3-touch caps.
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>21:00–09:00 IST Block</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs relative">
              <div className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider mb-2">Stage 03</div>
              <h3 className="text-sm font-bold text-neutral-900">Structured Parsing</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                LLM extracts candidate promises, amounts, and dates into strict JSON schemas with confidence scores.
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Zero write permission</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs relative">
              <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider mb-2">Stage 04</div>
              <h3 className="text-sm font-bold text-neutral-900">Policy Validation</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Deterministic Policy Engine validates horizons, logs commitments, or triggers the Dispute Freeze rule.
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                <Shield className="w-3 h-3 text-blue-600" />
                <span>Frozen, not cancelled</span>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs relative">
              <div className="text-[10px] font-mono font-bold text-green-600 uppercase tracking-wider mb-2">Stage 05</div>
              <h3 className="text-sm font-bold text-neutral-900">Settlement Match</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Razorpay webhooks & bank APIs verify funds settlement, auto-resolving commitments and closing cases.
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span>CLOSED_PAID Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI / LLM Boundary — Two-Panel Architecture Proof */}
      <section id="ai-boundary" className="py-20 md:py-28 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Architectural Safety
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950 mt-2 tracking-tight">
              AI proposes. The Policy Engine decides.
            </h2>
            <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
              We do not give LLMs database write access or tool execution powers. The model operates solely as a schema-constrained structured output parser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Panel: What the AI Does */}
            <div className="bg-purple-50/40 rounded-xl border border-purple-200/80 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center text-purple-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
                  What the AI Does (Intelligence Layer)
                </h3>
              </div>

              <ul className="space-y-3 text-xs text-purple-900/90 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Classifies Inbound Intent</strong> — Detects promise candidates, dispute grounds, or ambiguity from unstructured emails/WhatsApp messages.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Extracts Structured Payloads</strong> — Pulls promised payment amounts and dates into strict, Zod-validated JSON formats.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Calculates Per-Call Confidence</strong> — Flags classifications below 70% confidence for clarification prompts rather than guessing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Drafts Outreach Copy</strong> — Tailors professional follow-ups using merchant brand voice and invoice history.</span>
                </li>
              </ul>
            </div>

            {/* Right Panel: What the Policy Engine Decides */}
            <div className="bg-neutral-50 rounded-xl border border-neutral-300 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  What the Policy Engine Decides (Authority Layer)
                </h3>
              </div>

              <ul className="space-y-3 text-xs text-neutral-700 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Sole State-Transition Authority</strong> — Only `StateTransitionService` writes `recovery_cases.state` and `commitments.status`.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Enforces Dispute-Freeze Rule</strong> — Freezes active commitments (`is_frozen = true`) during disputes; never deletes or voids them.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Hardcoded 13 Business Constants</strong> — Enforces 21:00-09:00 IST Quiet Hours, 3/7d touch limits, 90-day horizons, and escalation ladders.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Immutable Audit Recording</strong> — Appends every state delta with actor attribution and dual timestamps.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Guardrails & Policy Engine Configuration */}
      <section id="guardrails" className="py-20 md:py-28 bg-[#FDFCFB] border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Hardcoded Policy Rules
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950 mt-2 tracking-tight">
              13 Locked Constants in `domain/policy-engine/config.ts`
            </h2>
            <p className="text-sm text-neutral-600 mt-3">
              Zero inline numbers. Every threshold governing communication, validation, and escalation is an auditable constant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Quiet Hours</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  21:00–09:00 IST
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Zero outbound debtor messages dispatched during evening and night hours. Outreach queues until morning window opens.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Contact Frequency Cap</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  3 touches / 7 days
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Hard ceiling on communication touches per rolling 7-day window. Prevents spamming and preserves merchant brand reputation.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Promise Horizon</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  90 Days Max
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Promises extending beyond 90 calendar days are rejected by policy and routed for human credit review.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Partial Payment Tolerance</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  &ge; 90% Settles Full
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Settlements meeting 90% threshold transition to `CLOSED_PARTIAL` without triggering broken-promise escalations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Escalation Ladder</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  +3d &rarr; +7d &rarr; Day 14
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Automated progression from Reminder 2 to Reminder 3 to Collections Handoff if debtor remains completely unresponsive.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Dispute-Freeze Rule</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Frozen, Not Cancelled
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                Disputed commitments enter frozen hold state (`is_frozen = true`), preserving original dates until human dispute determination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Real Trust & Audit Trail — Framed Case Detail Proof */}
      <section id="audit-trail" className="py-20 md:py-28 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Live Product Proof
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950 mt-2 tracking-tight">
              An immutable decision ledger for every case
            </h2>
            <p className="text-sm text-neutral-600 mt-3">
              The 7-step causal chain for Case INV-2101 (Olive Trading) showing inbound replies, LLM intent extractions, and the Dispute-Freeze rule in action.
            </p>
          </div>

          {/* Browser Chrome Container */}
          <div className="rounded-xl border border-neutral-300 bg-white shadow-lg overflow-hidden">
            <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                <span className="text-xs font-mono text-neutral-500 ml-2">recoup.internal/app/cases/39fff352...</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
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
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 flex items-start justify-between">
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

              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 flex items-start justify-between">
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

              <div className="bg-purple-50/40 p-3.5 rounded-lg border border-purple-200 flex items-start justify-between">
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

              <div className="bg-blue-50/40 p-3.5 rounded-lg border border-blue-200 flex items-start justify-between">
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

              <div className="bg-amber-50/60 p-3.5 rounded-lg border border-amber-200 flex items-start justify-between">
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

            <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-between">
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

      {/* 8. Evaluation & Benchmark Results */}
      <section id="evaluation" className="py-20 md:py-28 bg-[#FDFCFB] border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Synthetic Benchmark
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950 mt-2 tracking-tight">
              Evaluated across 200 overdue enterprise invoices
            </h2>
            <p className="text-sm text-neutral-600 mt-3">
              Head-to-head comparison demonstrating a 26.4-point lift in recovered capital over standard 3-touch dunning cadences.
            </p>
          </div>

          {/* Benchmark Bar Chart Module */}
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 shadow-xs">
            <div className="border-b border-neutral-100 pb-4 mb-6">
              <p className="text-base font-semibold text-neutral-900">
                Portfolio Recovery Rate: <span className="font-bold text-neutral-950">68.4%</span> vs.{' '}
                <span className="text-neutral-500">42.0% static dunning</span> —{' '}
                <span className="text-green-700 font-bold">a 26.4-point recovery lift</span>
              </p>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-neutral-900">Recoup Autonomous Recovery Agent</span>
                  <span className="text-blue-700 font-mono font-bold">68.4%</span>
                </div>
                <div className="h-6 w-full bg-neutral-100 rounded-md overflow-hidden p-0.5">
                  <div
                    className="h-full bg-blue-600 rounded flex items-center justify-end pr-2 text-[11px] text-white font-mono font-bold"
                    style={{ width: '68.4%' }}
                  >
                    68.4%
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-neutral-500">Static 3-Touch Cadence Baseline (Industry Standard)</span>
                  <span className="text-neutral-500 font-mono">42.0%</span>
                </div>
                <div className="h-6 w-full bg-neutral-100 rounded-md overflow-hidden p-0.5">
                  <div
                    className="h-full bg-neutral-400 rounded flex items-center justify-end pr-2 text-[11px] text-white font-mono font-medium"
                    style={{ width: '42.0%' }}
                  >
                    42.0%
                  </div>
                </div>
              </div>
            </div>

            {/* Scale line */}
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-4 pt-2 border-t border-neutral-100">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA — Closing Bookend with Hero Motif */}
      <section className="relative py-20 md:py-28 bg-neutral-950 text-white overflow-hidden">
        {/* Subtle Background Echo */}
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen">
          <Image
            src="/hero.png"
            alt="Hero Texture Echo"
            fill
            className="object-cover object-center"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white">
            Built for how recovery already works <br className="hidden sm:inline" />
            <span className="italic font-serif text-blue-300">at Razorpay&apos;s scale.</span>
          </h2>
          <p className="text-base text-neutral-400 max-w-xl mx-auto mt-5 leading-relaxed">
            Eliminate revenue leakage, protect debtor relationships, and prove mathematical policy adherence on every overdue invoice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-all shadow-md active:scale-98"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app/simulation"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm font-semibold hover:bg-neutral-800 hover:text-white transition-all shadow-xs"
            >
              <span>Launch Clock Simulator</span>
              <Clock className="w-4 h-4 text-neutral-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Minimalist Footer */}
      <footer className="py-10 bg-white border-t border-neutral-200 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center text-white font-bold text-[10px]">
              R
            </div>
            <span className="font-semibold text-neutral-800">Recoup</span>
            <span>·</span>
            <span>Built for the Razorpay AI Buildathon 2026</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/app" className="hover:text-neutral-900 transition-colors">Console</Link>
            <Link href="/app/policy" className="hover:text-neutral-900 transition-colors">Policy Engine</Link>
            <Link href="/app/evaluation" className="hover:text-neutral-900 transition-colors">Benchmark</Link>
            <Link href="/app/simulation" className="hover:text-neutral-900 transition-colors">Simulation</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
