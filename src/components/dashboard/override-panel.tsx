'use client';

import { useState } from 'react';
import { ShieldAlert, Check, AlertTriangle } from 'lucide-react';

interface OverridePanelProps {
  caseId: string;
  currentState: string;
  hasFrozenCommitment: boolean;
  onSuccess?: () => void;
}

export function OverridePanel({
  caseId,
  currentState,
  hasFrozenCommitment,
  onSuccess,
}: OverridePanelProps) {
  const [justification, setJustification] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const actions = [];

  // Canonical Dispute Resolution Actions per 02_BACKEND_SPEC.md §6 & 06_UI_UX_DESIGN.md §6.2
  if (currentState === 'DISPUTE_OPEN') {
    actions.push({
      id: 'reject_dispute',
      label: 'Reject dispute — resume commitment',
      isDestructive: false,
      badge: 'Unfreezes commitment',
      consequence: hasFrozenCommitment
        ? 'The dispute will be rejected, unfreezing the active commitment (is_frozen = false) and resuming recovery toward the original payment due date.'
        : 'The dispute will be rejected and standard autonomous recovery cadence will resume.',
    });
    actions.push({
      id: 'uphold_dispute',
      label: 'Uphold dispute — void commitment',
      isDestructive: true,
      badge: 'Voids commitment',
      consequence: hasFrozenCommitment
        ? 'The dispute will be upheld, voiding the disputed commitment (VOIDED_BY_DISPUTE) and returning the case for credit adjustment or open renegotiation.'
        : 'The dispute will be upheld and the case will transition for credit adjustment.',
    });
  } else if (
    currentState !== 'ESCALATED' &&
    currentState !== 'CLOSED_PAID' &&
    currentState !== 'CLOSED_WRITTEN_OFF'
  ) {
    actions.push({
      id: 'escalate',
      label: 'Force escalate to Human Review',
      isDestructive: true,
      badge: 'Escalation',
      consequence: 'This will immediately escalate the case to manual review/collections handoff regardless of policy cadence.',
    });
    actions.push({
      id: 'write_off',
      label: 'Write off balance',
      isDestructive: true,
      badge: 'Write off',
      consequence: 'This will close the case permanently as written off. No further outreach will occur.',
    });
  }

  if (actions.length === 0) {
    return (
      <div className="bg-neutral-50 rounded-lg p-6 text-center border border-neutral-200">
        <p className="text-xs text-neutral-500">No manual override actions available for the current state ({currentState}).</p>
      </div>
    );
  }

  const selectedActionDef = actions.find((a) => a.id === selectedAction);

  async function handleSubmit() {
    if (!selectedActionDef || loading) return;
    if (selectedActionDef.isDestructive && !confirming) {
      setConfirming(true);
      return;
    }

    // Immediately enter submitting state to prevent double click
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedActionDef.id,
          justification: justification.trim(),
          expectedState: currentState,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply override action');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while executing override');
      setLoading(false);
      setConfirming(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 rounded-lg p-6 border border-green-200 flex items-center justify-center gap-2">
        <Check className="w-5 h-5 text-green-600" />
        <span className="text-sm font-medium text-green-800">Dispute resolution override applied successfully</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neutral-500" />
          <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Human Override {currentState === 'DISPUTE_OPEN' ? '— Dispute Determination' : ''}
          </h3>
        </div>
        {hasFrozenCommitment && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Frozen Commitment Active
          </span>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-xs border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-2">
            Select override decision
          </label>
          <div className="flex flex-col gap-2">
            {actions.map((action) => (
              <label
                key={action.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAction === action.id
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="override_action"
                  value={action.id}
                  disabled={loading}
                  checked={selectedAction === action.id}
                  onChange={() => {
                    setSelectedAction(action.id);
                    setConfirming(false);
                  }}
                  className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-blue-600 border-neutral-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900">
                      {action.label}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                      {action.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    {action.consequence}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="justification" className="block text-xs font-semibold text-neutral-700 mb-1">
            Reviewer Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            id="justification"
            rows={3}
            disabled={loading}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors disabled:bg-neutral-100"
            placeholder="Mandatory audit justification: explain the basis for upholding or rejecting this dispute..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
          <p className="text-[10px] text-neutral-400 mt-1">
            Logged permanently in the append-only audit trail with your reviewer ID.
          </p>
        </div>

        {confirming && selectedActionDef && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">Confirm override execution</p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{selectedActionDef.consequence}</p>
            </div>
          </div>
        )}

        <div className="pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedAction || !justification.trim()}
            className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              confirming && selectedActionDef?.isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : 'bg-neutral-900 text-white hover:bg-black focus:ring-neutral-900'
            }`}
          >
            {loading
              ? 'Executing state transition...'
              : confirming
              ? 'Confirm & Apply Decision'
              : 'Apply Override Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}
