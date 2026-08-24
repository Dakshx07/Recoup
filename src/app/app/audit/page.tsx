import { createClient } from '@/lib/supabase/server';
import { AuditTimeline, AuditEvent } from '@/components/dashboard/audit-timeline';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('audit_events')
    .select('*')
    .order('real_wall_clock_time', { ascending: false })
    .limit(50);

  const auditEvents: AuditEvent[] = (logs || []).map((log) => ({
    id: log.id,
    actor: log.actor,
    eventType: log.event_type,
    summary: log.summary,
    details: log.details,
    simulatedTime: log.simulated_time,
    realTime: log.real_wall_clock_time,
  }));

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          System Audit Log
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Immutable ledger of all state transitions and automated decisions.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        {error ? (
          <p className="text-sm text-red-600">Failed to load audit logs.</p>
        ) : auditEvents.length > 0 ? (
          <AuditTimeline events={auditEvents} />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-neutral-500">No events recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
