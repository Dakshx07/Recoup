import { createClient } from '@/lib/supabase/server';
import { MetricStrip } from '@/components/dashboard/metric-strip';
import { CaseTable, CaseRowData } from '@/components/dashboard/case-table';
import { AuditTimeline, AuditEvent } from '@/components/dashboard/audit-timeline';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const supabase = await createClient();

  // 1. Fetch current simulated time from the latest audit event
  const { data: latestAudit } = await supabase
    .from('audit_events')
    .select('simulated_time')
    .order('simulated_time', { ascending: false })
    .limit(1)
    .single();

  const simulatedNow = latestAudit?.simulated_time || new Date().toISOString();

  // 2. Fetch top cases needing attention (Disputed, Ghosted, Escalated)
  const { data: attentionCases } = await supabase
    .from('recovery_cases')
    .select(`
      id,
      state,
      escalation_level,
      updated_at,
      opened_at,
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
    invoiceNumber: row.invoices?.invoice_number || 'INV-0000',
    debtorName: row.invoices?.debtors?.name || 'Debtor',
    outstandingAmount: row.invoices?.outstanding_amount || 0,
    state: row.state,
    escalationLevel: row.escalation_level,
    lastActivityAt: row.updated_at || row.opened_at,
  }));

  // 3. Fetch global recent audit events (ordered by simulated_time)
  const { data: recentLogs } = await supabase
    .from('audit_events')
    .select('*')
    .order('simulated_time', { ascending: false })
    .limit(6);

  const auditEvents: AuditEvent[] = (recentLogs || []).map((log) => ({
    id: String(log.id),
    actor: log.actor,
    eventType: log.event_type,
    summary: log.reason || log.summary || log.event_type,
    details: undefined, // compact summary in overview
    simulatedTime: log.simulated_time || log.real_wall_clock_time,
    realTime: log.real_wall_clock_time,
  }));

  // 4. Fetch live metrics from database
  const { data: allStats } = await supabase.from('recovery_cases').select(`
    state,
    invoices (
      outstanding_amount,
      original_amount
    )
  `);

  const { data: allPayments } = await supabase.from('payments').select('amount');
  const recovered = (allPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  let atRisk = 0;
  let activeCases = 0;
  let escalated = 0;
  let totalAmount = 0;

  (allStats || []).forEach((row: any) => {
    const orig = row.invoices?.original_amount || 0;
    const out = row.invoices?.outstanding_amount || 0;
    totalAmount += orig;

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
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Recovery operations summary, real-time portfolio health, and critical actions.
        </p>
      </div>

      <MetricStrip
        recovered={recovered}
        atRisk={atRisk}
        activeCases={activeCases}
        escalated={escalated}
        totalAmount={totalAmount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Attention — Primary operational focus */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Needs Attention
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Cases requiring human review, disputed commitments, or unreached escalations.
              </p>
            </div>
            <Link
              href="/app/cases?tab=attention"
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CaseTable
            cases={mappedAttentionCases}
            isEmpty={mappedAttentionCases.length === 0}
            simulatedNow={simulatedNow}
          />
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Recent Audit Trail
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Latest policy decisions
              </p>
            </div>
            <Link
              href="/app/audit"
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5"
            >
              Full log
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            {auditEvents.length > 0 ? (
              <AuditTimeline events={auditEvents} />
            ) : (
              <p className="text-xs text-neutral-500 text-center py-6">
                No recent activity recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
