import { getServerClient } from '../src/infra/supabase-server-client';

async function findPromiseThenDispute() {
  const db = getServerClient();
  const { data: cases } = await db
    .from('recovery_cases')
    .select(`
      id,
      state,
      invoices (
        id,
        invoice_number,
        debtors (
          name,
          contact_ref
        )
      ),
      commitments (
        id,
        status,
        is_frozen,
        promised_amount
      )
    `)
    .eq('state', 'DISPUTE_OPEN');

  const promiseDisputes = (cases || []).filter((c: any) => {
    const contact = c.invoices?.debtors?.contact_ref || '';
    return contact.includes('promise_then_dispute');
  });

  console.log(`Found ${promiseDisputes.length} PROMISE_THEN_DISPUTE cases:`);
  promiseDisputes.slice(0, 5).forEach((c: any) => {
    console.log(`- Case ID: ${c.id}`);
    console.log(`  Invoice: ${c.invoices?.invoice_number} (${c.invoices?.debtors?.name})`);
    console.log(`  Commitments:`, c.commitments);
  });
}

findPromiseThenDispute();
