import { CheckCircle2, AlertTriangle, TrendingUp, Sparkles, Brain, Scale, Users } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'metrics' } = await searchParams;

  // In a real implementation (Step 17), this would query the `eval_runs` snapshot table
  // For now, this acts as the UI shell pending the evaluation harness data connection.

  const metrics = [
    { label: 'Recovery rate', value: '78.4%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Promise-kept rate', value: '92.1%', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'False-escalation', value: '0.0%', icon: AlertTriangle, color: 'text-neutral-600', bg: 'bg-neutral-50' },
    { label: 'Dispute correctness', value: '100%', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Classification acc.', value: '98.5%', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Hallucination rate', value: '0.2%', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Human overrides', value: '4.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const scenarios = [
    { name: 'Clean promise, kept on time', share: '30%', passed: 60, total: 60 },
    { name: 'Broken promise, no dispute', share: '15%', passed: 30, total: 30 },
    { name: 'Promise, then dispute (Freeze)', share: '10%', passed: 20, total: 20 },
    { name: 'Direct dispute, no promise', share: '10%', passed: 20, total: 20 },
    { name: 'Ghost (no reply)', share: '15%', passed: 30, total: 30 },
    { name: 'Ambiguous reply', share: '10%', passed: 19, total: 20 },
    { name: 'Partial payment', share: '5%', passed: 10, total: 10 },
    { name: 'Unprompted direct payment', share: '5%', passed: 10, total: 10 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Evaluation Harness
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Performance across the 200-invoice synthetic dataset.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <Link
          href="?tab=metrics"
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            tab === 'metrics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Key Metrics
        </Link>
        <Link
          href="?tab=model"
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            tab === 'model'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Model Activity
        </Link>
      </div>

      {tab === 'metrics' && (
        <div className="space-y-8">
          {/* 7-Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-white p-4 rounded-lg border border-neutral-200">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${m.bg}`}>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className="text-xs text-neutral-500 font-medium mb-1">{m.label}</p>
                  <p className="text-xl font-semibold text-neutral-900 tabular-nums">
                    {m.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Scenarios Table */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Scenario Breakdown
              </h2>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-neutral-100 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Scenario</th>
                  <th className="px-4 py-3 font-medium">Dataset Share</th>
                  <th className="px-4 py-3 font-medium text-right">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {scenarios.map((s) => (
                  <tr key={s.name} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{s.share}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.passed === s.total ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {s.passed} / {s.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'model' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <Sparkles className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-900">Model Activity Log</p>
          <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
            Detailed view of LLM `reply_parses`, including raw confidence scores and extracted schema values. Connect this to the `reply_parses` table when ready.
          </p>
        </div>
      )}
    </div>
  );
}
