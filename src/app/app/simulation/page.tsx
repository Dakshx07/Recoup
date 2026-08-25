import { createClient } from '@/lib/supabase/server';
import { SimulationClient } from './simulation-client';

export const dynamic = 'force-dynamic';

export default async function SimulationPage() {
  const supabase = await createClient();

  // Fetch current authoritative simulated time from latest audit event
  const { data: latestAudit } = await supabase
    .from('audit_events')
    .select('simulated_time')
    .order('simulated_time', { ascending: false })
    .limit(1)
    .single();

  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  const { count: caseCount } = await supabase
    .from('recovery_cases')
    .select('*', { count: 'exact', head: true });

  const initialSimulatedTime = latestAudit?.simulated_time || '2026-01-01T09:00:00+05:30';

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Simulation & Demo Environment
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Control the authoritative simulated clock, trigger daily cron jobs, and observe automated state machine transitions.
        </p>
      </div>

      <SimulationClient
        initialSimulatedTime={initialSimulatedTime}
        totalCases={caseCount ?? 0}
        totalInvoices={invoiceCount ?? 0}
      />
    </div>
  );
}
