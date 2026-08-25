import { getServerClient } from '../src/infra/supabase-server-client';
import { v4 as uuidv4 } from 'uuid';

async function testInsert() {
  const db = getServerClient();
  const { data: invs } = await db.from('invoices').select('id').limit(1);
  const invId = invs![0].id;
  const caseId = uuidv4();

  const { data, error } = await db.from('recovery_cases').insert({
    id: caseId,
    invoice_id: invId,
    state: 'CLOSED_PAID',
    escalation_level: 'NONE',
    closed_at: new Date().toISOString(),
    closure_reason: 'Promise kept',
    opened_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select();

  console.log('Insert result:', data, 'Error:', error);
}

testInsert();
