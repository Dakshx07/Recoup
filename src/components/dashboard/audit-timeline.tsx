'use client';

import { useState } from 'react';
import { Shield, Sparkles, User, Settings, CheckCircle, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { format } from 'date-fns';

export interface AuditEvent {
  id: string;
  actor: 'system' | 'policy_engine' | 'llm' | 'human' | 'payment_verifier';
  eventType: string;
  summary: string;
  details?: any; // JSON payload
  simulatedTime: string;
  realTime: string;
  isHighlight?: boolean;
}

interface AuditTimelineProps {
  events: AuditEvent[];
}

const ACTOR_CONFIG = {
  system: { label: 'System', icon: Settings, bg: 'bg-neutral-100', text: 'text-neutral-700', badge: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  policy_engine: { label: 'Policy Engine', icon: Shield, bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  llm: { label: 'LLM Parser', icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  human: { label: 'Human Reviewer', icon: User, bg: 'bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  payment_verifier: { label: 'Payment Verifier', icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-50 text-green-700 border-green-200' },
};

function formatSimTime(isoStr: string) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'MMM d, yyyy · h:mm a');
}

function formatRealWallClock(isoStr: string) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'yyyy-MM-dd HH:mm:ss') + ' UTC';
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <div className="relative border-l border-neutral-200 ml-3 space-y-4 pb-4">
      {events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}

function TimelineItem({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const config = ACTOR_CONFIG[event.actor] || ACTOR_CONFIG.system;
  const Icon = event.eventType === 'debtor_reply_received' ? Mail : config.icon;

  const isDisputeOrFreeze =
    event.eventType.includes('dispute') || event.eventType.includes('freeze') || event.eventType.includes('DISPUTE');
  const isLLM = event.actor === 'llm';

  return (
    <div className="relative pl-6">
      {/* Connector Node */}
      <div
        className={`absolute -left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${config.bg}`}
      >
        <Icon className={`w-3.5 h-3.5 ${config.text}`} />
      </div>

      <div
        className={`rounded-lg p-3.5 border transition-colors ${
          isDisputeOrFreeze
            ? 'bg-amber-50/70 border-amber-200'
            : isLLM
            ? 'bg-purple-50/30 border-purple-100'
            : 'bg-white border-neutral-200 hover:bg-neutral-50/50'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-[11px] font-mono text-neutral-400">·</span>
              <span className="text-xs font-mono font-medium text-neutral-600">
                {event.eventType}
              </span>
            </div>

            <p className="text-xs font-medium text-neutral-900 leading-relaxed">
              {event.summary}
            </p>
          </div>
          
          {/* Dual Timestamps per 02_BACKEND_SPEC.md §8 (Simulated + Real Wall-Clock) */}
          <div className="text-left sm:text-right flex-shrink-0 font-mono">
            <p className="text-[11px] font-semibold text-neutral-800 tabular-nums">
              {formatSimTime(event.simulatedTime)}
            </p>
            <p className="text-[10px] text-neutral-400 tabular-nums mt-0.5">
              Real: {formatRealWallClock(event.realTime)}
            </p>
          </div>
        </div>

        {/* Structured LLM or Policy Payload */}
        {event.details && Object.keys(event.details).length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-neutral-100">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-medium text-neutral-500 hover:text-neutral-700 flex items-center gap-1 font-mono"
            >
              {expanded ? 'Hide structured parse' : 'View structured LLM output'}
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {expanded && (
              <pre className="mt-2 p-2.5 rounded bg-neutral-900 text-neutral-100 text-[11px] overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
