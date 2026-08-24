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

  // Build the query
  let query = supabase
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
    .order('updated_at', { ascending: false });

  if (tab === 'attention') {
    query = query.in('state', ['DISPUTE_OPEN', 'GHOSTED', 'ESCALATED']);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cases:', error);
  }

  // Map to UI representation
  const cases: CaseRowData[] = (data || []).map((row: any) => ({
    id: row.id,
    invoiceNumber: row.invoices?.invoice_number || 'Unknown',
    debtorName: row.invoices?.debtors?.name || 'Unknown',
    outstandingAmount: row.invoices?.outstanding_amount || 0,
    state: row.state,
    escalationLevel: row.escalation_level,
    lastActivityAt: row.updated_at,
  }));

  // Fetch metrics (this would ideally be a separate aggregated query, doing a naive fetch here for MVP)
  // To avoid hitting the DB multiple times with heavy queries, we can just aggregate from a single query or a view.
  // For now, let's fetch basic stats:
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Case queue
        </h1>
      </div>

      <MetricStrip
        recovered={recovered}
        atRisk={atRisk}
        activeCases={activeCases}
        escalated={escalated}
        totalAmount={totalAmount}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-6 border-b border-neutral-200">
          <Link
            href="?tab=attention"
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === 'attention'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Needs attention
          </Link>
          <Link
            href="?tab=all"
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            All cases
          </Link>
        </div>

        <CaseTable cases={cases} isEmpty={!data || data.length === 0} />
      </div>
    </div>
  );
}
