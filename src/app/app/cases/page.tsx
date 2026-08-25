import { createClient } from '@/lib/supabase/server';
import { CaseTable, CaseRowData } from '@/components/dashboard/case-table';
import { MetricStrip } from '@/components/dashboard/metric-strip';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { tab = 'attention' } = await searchParams;

  // 1. Get current simulated time from most recent audit event
  const { data: latestAudit } = await supabase
    .from('audit_events')
    .select('simulated_time')
    .order('simulated_time', { ascending: false })
    .limit(1)
    .single();

  const simulatedNow = latestAudit?.simulated_time || new Date().toISOString();

  // 2. Build the case query
  let query = supabase
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
        original_amount,
        debtors (
          name
        )
      )
    `)
    .order('updated_at', { ascending: false });

  if (tab === 'attention') {
    // Attention tab: Disputed, Ghosted, Escalated
    query = query.in('state', ['DISPUTE_OPEN', 'GHOSTED', 'ESCALATED']);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cases:', error);
  }

  // Map to UI representation
  const cases: CaseRowData[] = (data || []).map((row: any) => ({
    id: row.id,
    invoiceNumber: row.invoices?.invoice_number || 'INV-0000',
    debtorName: row.invoices?.debtors?.name || 'Debtor',
    outstandingAmount: row.invoices?.outstanding_amount || 0,
    state: row.state,
    escalationLevel: row.escalation_level,
    lastActivityAt: row.updated_at || row.opened_at,
  }));

  // Fetch portfolio stats for the metric strip
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
          Case Queue
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Active recovery operations, prioritized by urgency and policy triggers.
        </p>
      </div>

      <MetricStrip
        recovered={recovered}
        atRisk={atRisk}
        activeCases={activeCases}
        escalated={escalated}
        totalAmount={totalAmount}
      />

      <div className="space-y-3.5">
        <div className="flex items-center gap-6 border-b border-neutral-200">
          <Link
            href="/app/cases?tab=attention"
            className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === 'attention'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Needs attention
          </Link>
          <Link
            href="/app/cases?tab=all"
            className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            All cases
          </Link>
        </div>

        <CaseTable
          cases={cases}
          isEmpty={!data || data.length === 0}
          simulatedNow={simulatedNow}
        />
      </div>
    </div>
  );
}
