import { getServerClient } from '../src/infra/supabase-server-client';

async function main() {
  const db = getServerClient();
  const { data: cases, error: caseErr, count: caseCount } = await db.from('recovery_cases').select('id, state, invoice_id, escalation_level, opened_at, updated_at', { count: 'exact' });
  console.log('Recovery cases:', caseCount, 'Error:', caseErr);
  if (cases && cases.length > 0) {
    console.log('Sample case:', cases[0]);
  }

  const { data: invs, error: invErr, count: invCount } = await db.from('invoices').select('id, invoice_number, outstanding_amount, debtors(name)', { count: 'exact' }).limit(3);
  console.log('Invoices count:', invCount, 'Error:', invErr);
  if (invs) {
    console.log('Sample invoice:', JSON.stringify(invs[0]));
  }

  // Join test
  const { data: joined, error: joinErr } = await db.from('recovery_cases').select(`
    id, state, escalation_level, updated_at, opened_at,
    invoices (
      invoice_number, outstanding_amount, original_amount,
      debtors ( name )
    )
  `).limit(3);
  console.log('Joined query count:', joined?.length, 'Error:', joinErr);
  if (joined && joined.length > 0) {
    console.log('Joined sample:', JSON.stringify(joined[0]));
  }
}

main();
