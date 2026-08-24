import { createClient } from '@/lib/supabase/server';
import { MetricStrip } from '@/components/dashboard/metric-strip';
import { CaseTable, CaseRowData } from '@/components/dashboard/case-table';
import { AuditTimeline, AuditEvent } from '@/components/dashboard/audit-timeline';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const supabase = await createClient();

  // 1. Fetch top cases needing attention
  const { data: attentionCases } = await supabase
    .from('recovery_cases')
    .select(`
      id,
      state,
      escalation_level,
      updated_at,
      invoices (
        invoice_number,
        outstanding_amount,
        debtors (
          name
        )
      )
    `)
    .in('state', ['DISPUTE_OPEN', 'GHOSTED', 'ESCALATED'])
    .order('updated_at', { ascending: false })
    .limit(5);

  const mappedAttentionCases: CaseRowData[] = (attentionCases || []).map((row: any) => ({
    id: row.id,
    invoiceNumber: row.invoices?.invoice_number || 'Unknown',
    debtorName: row.invoices?.debtors?.name || 'Unknown',
    outstandingAmount: row.invoices?.outstanding_amount || 0,
    state: row.state,
    escalationLevel: row.escalation_level,
    lastActivityAt: row.updated_at,
  }));

  // 2. Fetch global recent audit events
  const { data: recentLogs } = await supabase
    .from('audit_events')
    .select('*')
    .order('real_wall_clock_time', { ascending: false })
    .limit(8);

  const auditEvents: AuditEvent[] = (recentLogs || []).map((log) => ({
    id: log.id,
    actor: log.actor,
    eventType: log.event_type,
    summary: log.summary,
    details: undefined, // Hide details in the global summary view to save space
    simulatedTime: log.simulated_time,
    realTime: log.real_wall_clock_time,
  }));

  // 3. Fetch metrics (naive aggregation for MVP)
  const { data: allStats } = await supabase.from('recovery_cases').select(`
    state,
    invoices (
      outstanding_amount,
      original_amount
    )
  `);

  let recovered = 0;
  let atRisk = 0;
  let activeCases = 0;
  let escalated = 0;
  let totalAmount = 0;

  (allStats || []).forEach((row: any) => {
    const orig = row.invoices?.original_amount || 0;
    const out = row.invoices?.outstanding_amount || 0;
    totalAmount += orig;
    recovered += (orig - out);

    if (row.state === 'ESCALATED') {
      escalated++;
      atRisk += out;
    } else if (
      row.state !== 'CLOSED_PAID' &&
      row.state !== 'CLOSED_PARTIAL' &&
      row.state !== 'CLOSED_WRITTEN_OFF'
    ) {
      activeCases++;
      atRisk += out;
    }
  });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          System-wide recovery performance and urgent cases.
        </p>
      </div>

      <MetricStrip
        recovered={recovered}
        atRisk={atRisk}
        activeCases={activeCases}
        escalated={escalated}
        totalAmount={totalAmount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Needs Attention
            </h2>
            <Link
              href="/app/cases?tab=attention"
              className="text-sm font-medium text-blue-600 hover:underline flex items-center"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          <CaseTable cases={mappedAttentionCases} isEmpty={mappedAttentionCases.length === 0} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Recent Activity
            </h2>
            <Link
              href="/app/audit"
              className="text-sm font-medium text-blue-600 hover:underline flex items-center"
            >
              Full log
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            {auditEvents.length > 0 ? (
              <AuditTimeline events={auditEvents} />
            ) : (
              <p className="text-sm text-neutral-500 text-center py-6">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
