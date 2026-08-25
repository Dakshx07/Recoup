import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Shield, Sparkles, User, Settings, CheckCircle, Search, Filter, ArrowUpRight, ExternalLink } from 'lucide-react';
import { formatSimulatedTime } from '@/lib/simulated-time';

export const dynamic = 'force-dynamic';

const ACTOR_BADGES: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  system: { label: 'system', bg: 'bg-neutral-100', text: 'text-neutral-700', icon: Settings },
  policy_engine: { label: 'policy_engine', bg: 'bg-blue-50', text: 'text-blue-700', icon: Shield },
  llm: { label: 'llm', bg: 'bg-purple-50', text: 'text-purple-700', icon: Sparkles },
  human: { label: 'human', bg: 'bg-amber-50', text: 'text-amber-700', icon: User },
  payment_verifier: { label: 'payment_verifier', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; event_type?: string; search?: string }>;
}) {
  const { actor, event_type, search } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('audit_events')
    .select('*')
    .order('simulated_time', { ascending: false })
    .limit(100);

  if (actor && actor !== 'all') {
    query = query.eq('actor', actor);
  }
  if (event_type && event_type !== 'all') {
    query = query.eq('event_type', event_type);
  }
  if (search) {
    query = query.or(`reason.ilike.%${search}%,event_type.ilike.%${search}%`);
  }

  const { data: logs, error } = await query;
  const events = logs || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            System Audit Log
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Immutable, dual-timestamped ledger of every state transition, policy decision, and human override.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono bg-white px-3 py-1.5 rounded-md border border-neutral-200">
          <span>{events.length} events logged</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form method="GET" className="bg-white rounded-lg border border-neutral-200 p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="search"
            defaultValue={search || ''}
            placeholder="Search by reason or event type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-neutral-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            name="actor"
            defaultValue={actor || 'all'}
            className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Actors</option>
            <option value="policy_engine">Policy Engine</option>
            <option value="system">System</option>
            <option value="human">Human</option>
            <option value="llm">LLM</option>
            <option value="payment_verifier">Payment Verifier</option>
          </select>

          <select
            name="event_type"
            defaultValue={event_type || 'all'}
            className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Event Types</option>
            <option value="case_opened">Case Opened</option>
            <option value="commitment_validated">Commitment Validated</option>
            <option value="dispute_detected_commitment_frozen">Dispute (Commitment Frozen)</option>
            <option value="commitment_kept">Commitment Kept</option>
            <option value="commitment_broken">Commitment Broken</option>
            <option value="case_ghosted">Case Ghosted</option>
            <option value="escalation_raised">Escalation Raised</option>
            <option value="payment_verified">Payment Verified</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-md hover:bg-black transition-colors"
          >
            Filter
          </button>

          {(actor || event_type || search) && (
            <Link
              href="/app/audit"
              className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {/* Dense Operational Audit Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 font-medium">Simulated Time</th>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Event Type</th>
                <th className="px-4 py-2.5 font-medium">State Delta</th>
                <th className="px-4 py-2.5 font-medium">Reason & Summary</th>
                <th className="px-4 py-2.5 font-medium text-right">Entity Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.length > 0 ? (
                events.map((event) => {
                  const actorConfig = ACTOR_BADGES[event.actor] || ACTOR_BADGES.system;
                  const ActorIcon = actorConfig.icon;
                  const isFreeze = event.event_type?.includes('freeze') || event.event_type?.includes('dispute');

                  return (
                    <tr
                      key={event.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isFreeze ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono text-neutral-600">
                        {formatSimulatedTime(event.simulated_time || event.real_wall_clock_time)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${actorConfig.bg} ${actorConfig.text}`}>
                          <ActorIcon className="w-3 h-3" />
                          {actorConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-neutral-800 font-medium">
                        {event.event_type}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500 font-mono text-[11px]">
                        {event.previous_state ? `${event.previous_state} → ` : ''}
                        <span className="text-neutral-900 font-semibold">{event.new_state || '—'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-neutral-700 max-w-md truncate">
                        {event.reason || event.summary || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {event.entity_id ? (
                          <Link
                            href={`/app/cases/${event.entity_id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono text-[11px]"
                          >
                            Case
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    No audit events found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
