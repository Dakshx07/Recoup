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

  if (currentState === 'DISPUTE_OPEN' && hasFrozenCommitment) {
    actions.push({
      id: 'reject_dispute',
      label: 'Reject dispute (Resume commitment)',
      isDestructive: false,
      consequence: 'The dispute will be rejected and the original commitment will resume toward its due date.',
    });
    actions.push({
      id: 'uphold_dispute',
      label: 'Uphold dispute (Void commitment)',
      isDestructive: true,
      consequence: 'This will void the active commitment and reopen the case for negotiation. This cannot be undone.',
    });
  } else if (
    currentState !== 'ESCALATED' &&
    currentState !== 'CLOSED_PAID' &&
    currentState !== 'CLOSED_WRITTEN_OFF'
  ) {
    actions.push({
      id: 'escalate',
      label: 'Force escalate',
      isDestructive: true,
      consequence: 'This will immediately escalate the case to manual review/collections regardless of policy rules.',
    });
    actions.push({
      id: 'write_off',
      label: 'Write off',
      isDestructive: true,
      consequence: 'This will close the case permanently as written off. No further outreach will occur.',
    });
  }

  if (actions.length === 0) {
    return (
      <div className="bg-neutral-50 rounded-lg p-6 text-center border border-neutral-200">
        <p className="text-sm text-neutral-500">No manual actions available for the current state.</p>
      </div>
    );
  }

  const selectedActionDef = actions.find((a) => a.id === selectedAction);

  async function handleSubmit() {
    if (!selectedActionDef) return;
    if (selectedActionDef.isDestructive && !confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // In a real app, this hits the API Route which uses the service_role key to bypass RLS
      const res = await fetch(`/api/cases/${caseId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedActionDef.id,
          justification,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to apply override');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      setConfirming(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 rounded-lg p-6 border border-green-200 flex items-center justify-center gap-2">
        <Check className="w-5 h-5 text-green-600" />
        <span className="text-sm font-medium text-green-800">Action applied successfully</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-neutral-500" />
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
          Human Override
        </h3>
      </div>
      
      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-2">
            Select action
          </label>
          <div className="flex flex-col gap-2">
            {actions.map((action) => (
              <label
                key={action.id}
                className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedAction === action.id
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="override_action"
                  value={action.id}
                  checked={selectedAction === action.id}
                  onChange={() => {
                    setSelectedAction(action.id);
                    setConfirming(false);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-600 border-neutral-300"
                />
                <span className="text-sm font-medium text-neutral-900">
                  {action.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="justification" className="block text-xs font-medium text-neutral-700 mb-1">
            Justification (required)
          </label>
          <textarea
            id="justification"
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            placeholder="Explain the reason for this manual override..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </div>

        {confirming && selectedActionDef && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Are you sure?</p>
              <p className="text-sm text-amber-800 mt-1">{selectedActionDef.consequence}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedAction || !justification.trim()}
            className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              confirming && selectedActionDef?.isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : 'bg-neutral-900 text-white hover:bg-black focus:ring-neutral-900'
            }`}
          >
            {loading
              ? 'Processing...'
              : confirming
              ? 'Confirm action'
              : 'Apply override'}
          </button>
        </div>
      </div>
    </div>
  );
}
