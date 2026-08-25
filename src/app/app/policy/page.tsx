import { Shield, FileWarning, AlertCircle, Info } from 'lucide-react';
import {
  QUIET_HOURS_START,
  QUIET_HOURS_END,
  QUIET_HOURS_TIMEZONE,
  MAX_OUTREACH_PER_CASE,
  OUTREACH_ROLLING_WINDOW_DAYS,
  MAX_PROMISE_HORIZON_DAYS,
  PARTIAL_PAYMENT_TOLERANCE,
  ESCALATION_REMINDER_2_DAYS,
  ESCALATION_REMINDER_3_DAYS,
  ESCALATION_TRIGGER_DAYS,
  MAX_BROKEN_PROMISES_BEFORE_ESCALATION,
  MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION,
  LLM_CONFIDENCE_THRESHOLD,
  LLM_MAX_CORRECTIVE_REPROMPTS,
  MAX_OUTREACH_ATTEMPTS,
  MAX_ESCALATION_LEVEL,
} from '@/domain/policy-engine/config';

export const dynamic = 'force-dynamic';

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  value: string;
  category: string;
  isPlaceholder?: boolean; // Per spec: mark working defaults
}

export default async function PolicyPage() {
  // All values imported directly from config.ts — the source of truth.
  const policies: PolicyRule[] = [
    {
      id: 'quiet-hours',
      name: 'Quiet hours',
      description: `No outreach between ${QUIET_HOURS_START}:00 and ${String(QUIET_HOURS_END).padStart(2, '0')}:00 (${QUIET_HOURS_TIMEZONE}).`,
      value: `${QUIET_HOURS_START}:00 – ${String(QUIET_HOURS_END).padStart(2, '0')}:00 IST`,
      category: 'Contact Rules',
    },
    {
      id: 'contact-frequency',
      name: 'Contact frequency cap',
      description: `Maximum outreach per case within a rolling window.`,
      value: `${MAX_OUTREACH_PER_CASE} / ${OUTREACH_ROLLING_WINDOW_DAYS} days`,
      category: 'Contact Rules',
    },
    {
      id: 'max-outreach',
      name: 'Max outreach attempts',
      description: 'Absolute cap on outreach per case before escalation.',
      value: `${MAX_OUTREACH_ATTEMPTS}`,
      category: 'Contact Rules',
    },
    {
      id: 'promise-horizon',
      name: 'Max promise horizon',
      description: 'Promised payment date must be within this many days.',
      value: `${MAX_PROMISE_HORIZON_DAYS} days`,
      category: 'Promise Validity',
    },
    {
      id: 'partial-payment',
      name: 'Partial payment tolerance',
      description: `Payment ≥ this threshold of promised amount is treated as effectively kept.`,
      value: `${Math.round(PARTIAL_PAYMENT_TOLERANCE * 100)}%`,
      category: 'Promise Validity',
      isPlaceholder: true,
    },
    {
      id: 'escalation-r2',
      name: 'Escalation: first follow-up',
      description: 'Days after initial outreach for Reminder 2.',
      value: `+${ESCALATION_REMINDER_2_DAYS} days`,
      category: 'Escalation Ladder',
      isPlaceholder: true,
    },
    {
      id: 'escalation-r3',
      name: 'Escalation: firm reminder',
      description: 'Days after initial outreach for Reminder 3.',
      value: `+${ESCALATION_REMINDER_3_DAYS} days`,
      category: 'Escalation Ladder',
      isPlaceholder: true,
    },
    {
      id: 'escalation-trigger',
      name: 'Escalation: trigger day',
      description: 'Escalate if no commitment by this day.',
      value: `Day ${ESCALATION_TRIGGER_DAYS}`,
      category: 'Escalation Ladder',
      isPlaceholder: true,
    },
    {
      id: 'broken-promise-cap',
      name: 'Broken promises before escalation',
      description: 'Number of broken promises that trigger escalation.',
      value: `${MAX_BROKEN_PROMISES_BEFORE_ESCALATION}`,
      category: 'Escalation Ladder',
    },
    {
      id: 'max-escalation',
      name: 'Max escalation level',
      description: 'Terminal escalation level — case is handed off.',
      value: MAX_ESCALATION_LEVEL.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      category: 'Escalation Ladder',
    },
    {
      id: 'max-disputes',
      name: 'Max disputes before escalation',
      description: 'Cap on dispute-filing before mandatory human escalation.',
      value: `${MAX_DISPUTES_BEFORE_MANDATORY_ESCALATION}`,
      category: 'Dispute Rules',
    },
    {
      id: 'llm-confidence',
      name: 'LLM confidence threshold',
      description: 'Below this confidence → AMBIGUOUS, never guessed.',
      value: `${LLM_CONFIDENCE_THRESHOLD}`,
      category: 'LLM Boundary',
    },
    {
      id: 'llm-reprompt',
      name: 'LLM max corrective reprompts',
      description: 'Retries on schema failure before classifying as ambiguous.',
      value: `${LLM_MAX_CORRECTIVE_REPROMPTS}`,
      category: 'LLM Boundary',
    },
  ];

  // Group by category
  const categories = [...new Set(policies.map(p => p.category))];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Policy Engine
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Deterministic rules governing all automated transitions. Every threshold is a named constant — no value is decided by the model.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-2">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1">
            {category}
          </h2>
          <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
            {policies
              .filter(p => p.category === category)
              .map((policy) => (
                <div key={policy.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-neutral-900">{policy.name}</h3>
                      {policy.isPlaceholder && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Placeholder default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{policy.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-neutral-50 text-sm font-semibold text-neutral-900 font-mono border border-neutral-200">
                      {policy.value}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Dispute freeze explanation — per UI spec §5.6 */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-neutral-900">Dispute-freeze rule</h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              When a dispute is raised against an active commitment, the commitment is <strong>frozen</strong> — never cancelled.
              The original due date is preserved. A human reviewer resolves the dispute: rejected → un-freeze and resume;
              upheld → void commitment. This prevents debtors from escaping promises via disputes while also
              preventing enforcement of incorrect invoices.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 flex items-start gap-2.5">
        <FileWarning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-amber-800">
            <strong>Read-only view.</strong> Policy values are implemented as named TypeScript constants in the backend.
            Rules marked "Placeholder default" are working defaults, not validated business decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
