import { getServerClient } from '../src/infra/supabase-server-client';

async function checkCaseAudit() {
  const db = getServerClient();
  const caseId = '39fff352-9878-4b2e-a8cc-b1f45407f85c';
  const { data: logs } = await db
    .from('audit_events')
    .select('*')
    .eq('entity_id', caseId)
    .order('simulated_time', { ascending: true });

  console.log(`Audit events for case ${caseId} (INV-2101):`);
  logs?.forEach((l: any, i: number) => {
    console.log(`[Step ${i + 1}] ${l.actor} · ${l.event_type} (Sim: ${l.simulated_time}, Real: ${l.real_wall_clock_time})`);
    console.log(`         Reason: ${l.reason}`);
    if (l.details) console.log(`         Details:`, JSON.stringify(l.details));
  });
}

checkCaseAudit();
