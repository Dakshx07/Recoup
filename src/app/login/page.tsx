'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecoupLogo } from '@/components/ui/logo';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCustomLogin, setShowCustomLogin] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/app';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1-Click Evaluator Demo Access via secure server-side session generator
  async function handleDemoAccess() {
    setError(null);
    setDemoLoading(true);

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect: redirectParam }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to establish demo reviewer session');
      }

      router.push(data.redirect || '/app');
      router.refresh();
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err?.message || 'Unable to start demo session. Please try again.');
      setDemoLoading(false);
    }
  }

  // Standard Email/Password Sign-In
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setPasswordLoading(false);
        return;
      }

      router.push(redirectParam);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
      setPasswordLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <RecoupLogo size={40} className="w-10 h-10 shadow-xs" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Recoup Operations Console
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200/80 mt-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Razorpay AI Buildathon 2026 · Evaluator Demo</span>
          </div>
        </div>

        {/* Main Card: Evaluator Entry */}
        <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-6 sm:p-7">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Authorized Reviewer Demo Access</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Welcome judges and evaluators. Enter the live console with pre-configured reviewer credentials to test debt recovery workflows, simulated clock advancement, and dispute overrides.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Evaluator Action Button */}
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={demoLoading || passwordLoading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg bg-neutral-900 hover:bg-black text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
            >
              {demoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Initializing Reviewer Session…</span>
                </>
              ) : (
                <>
                  <span>Enter Live Demo Console</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Demo Capabilities Checklist */}
            <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span><strong>200 synthetic debtor cases</strong> across 5 lifecycle stages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span><strong>Deterministic policy authority</strong> (0 DB writes for LLMs)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span><strong>409-protected human dispute overrides</strong> & causal audit trail</span>
              </div>
            </div>
          </div>

          {/* Collapsible Custom Credential Sign-In */}
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => setShowCustomLogin(!showCustomLogin)}
              className="w-full flex items-center justify-between text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in with custom Supabase credentials</span>
              </span>
              {showCustomLogin ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showCustomLogin && (
              <form onSubmit={handlePasswordLogin} className="space-y-3 mt-4 pt-2">
                <div>
                  <label
                    htmlFor="custom-email"
                    className="block text-xs font-medium text-neutral-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="custom-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    placeholder="merchant@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-password"
                    className="block text-xs font-medium text-neutral-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="custom-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading || demoLoading}
                  className="w-full rounded-md bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? 'Signing in…' : 'Sign in with credentials'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security / Architecture Footer Note */}
        <div className="mt-6 text-center space-y-1 text-[11px] text-neutral-400 font-mono">
          <p>PostgreSQL Row Level Security (RLS) · Dual-Timestamped Audit Ledger</p>
          <p>© 2026 Recoup · Built for Razorpay AI Buildathon</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
