import { Shield, FileWarning, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PolicyPage() {
  const policies = [
    {
      id: 'escalation-threshold',
      name: 'Escalation Threshold',
      description: 'Minimum outstanding amount to trigger manual collections handoff.',
      value: '₹5,000',
    },
    {
      id: 'ghost-timeout',
      name: 'Ghosting Timeout',
      description: 'Days without reply before a case transitions to GHOSTED.',
      value: '14 Days',
    },
    {
      id: 'auto-write-off',
      name: 'Auto Write-off',
      description: 'Maximum amount that will be automatically written off if disputed or uncollectible.',
      value: '₹500',
    },
    {
      id: 'payment-window',
      name: 'Promise Payment Window',
      description: 'Days allowed for a debtor to fulfill a promised payment before it breaks.',
      value: '5 Days',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Policy Engine
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          System rules and thresholds governing automated transitions. (Read-only MVP)
        </p>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white rounded-lg border border-neutral-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neutral-900">{policy.name}</h3>
              <p className="text-sm text-neutral-500 mt-1">{policy.description}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-md bg-neutral-100 text-sm font-semibold text-neutral-900 font-mono">
                {policy.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
        <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-amber-900">Config updates disabled</h4>
          <p className="text-sm text-amber-800 mt-1">
            Editing policy rules is disabled in this environment. State transitions rely on hardcoded thresholds in the State Machine layer.
          </p>
        </div>
      </div>
    </div>
  );
}
