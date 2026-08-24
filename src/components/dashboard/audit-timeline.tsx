'use client';

import { useState } from 'react';
import { Shield, Sparkles, User, Settings, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  system: { icon: Settings, bg: 'bg-neutral-100', text: 'text-neutral-600' },
  policy_engine: { icon: Shield, bg: 'bg-blue-100', text: 'text-blue-600' },
  llm: { icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-600' },
  human: { icon: User, bg: 'bg-amber-100', text: 'text-amber-600' },
  payment_verifier: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-600' },
};

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return format(d, 'MMM d, h:mm a');
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <div className="relative border-l border-neutral-200 ml-3 space-y-6 pb-4">
      {events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}

function TimelineItem({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const config = ACTOR_CONFIG[event.actor] || ACTOR_CONFIG.system;
  const Icon = config.icon;

  const isDisputeOrFreeze =
    event.eventType.includes('DISPUTE') || event.eventType.includes('FREEZE');

  return (
    <div className="relative pl-6">
      {/* Connector Node */}
      <div
        className={`absolute -left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${config.bg}`}
      >
        <Icon className={`w-3 h-3 ${config.text}`} />
      </div>

      <div
        className={`rounded-lg p-3 transition-colors ${
          isDisputeOrFreeze ? 'bg-amber-50 border border-amber-100' : 'hover:bg-neutral-50'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {event.summary}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              <span className="font-medium text-neutral-700">{event.actor}</span> ·{' '}
              {event.eventType}
            </p>
          </div>
          
          <div className="text-right flex-shrink-0 group relative">
            <p className="text-xs text-neutral-500 font-medium tabular-nums cursor-help" title={`Real time: ${formatTime(event.realTime)}`}>
              {formatTime(event.simulatedTime)}
            </p>
          </div>
        </div>

        {event.details && Object.keys(event.details).length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
            >
              {expanded ? 'Hide details' : 'View raw output'}
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {expanded && (
              <pre className="mt-2 p-3 rounded bg-neutral-900 text-neutral-100 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
