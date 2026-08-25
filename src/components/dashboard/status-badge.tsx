/**
 * Status badge component per §9 — Maps RecoveryCaseState to semantic colors.
 *
 * Color is never the sole state signal — every badge carries a text label (§14).
 * Red is strictly reserved for primary Escalation / Error states.
 */

import { RecoveryCaseState } from '@/domain/state-machine/recovery-case.states';

const STATE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  [RecoveryCaseState.OPEN]: {
    label: 'Open',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    dot: 'bg-neutral-400',
  },
  [RecoveryCaseState.AWAITING_REPLY]: {
    label: 'Awaiting reply',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  [RecoveryCaseState.REPLY_PROCESSING]: {
    label: 'Processing',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  [RecoveryCaseState.COMMITMENT_ACTIVE]: {
    label: 'Commitment',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  [RecoveryCaseState.DISPUTE_OPEN]: {
    label: 'Disputed',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  [RecoveryCaseState.GHOSTED]: {
    label: 'Ghosted',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    dot: 'bg-neutral-400',
  },
  [RecoveryCaseState.ESCALATED]: {
    label: 'Escalated',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  [RecoveryCaseState.CLOSED_PAID]: {
    label: 'Paid',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  [RecoveryCaseState.CLOSED_PARTIAL]: {
    label: 'Partial',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
  },
  [RecoveryCaseState.CLOSED_WRITTEN_OFF]: {
    label: 'Written off',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
  },
};

export function StatusBadge({ state }: { state: string }) {
  const config = STATE_CONFIG[state] ?? {
    label: state,
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function EscalationBadge({ level }: { level: string }) {
  if (!level || level === 'NONE') return null;

  const labels: Record<string, string> = {
    REMINDER_2: 'Reminder 2',
    REMINDER_3: 'Reminder 3',
    HUMAN_REVIEW: 'Human review',
    COLLECTIONS_HANDOFF: 'Collections',
  };

  // Neutral gray chip per 07_REVIEW_NOTES.md B13 (avoids double-red diluting red semantic)
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
      {labels[level] ?? level}
    </span>
  );
}
