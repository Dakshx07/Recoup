/**
 * Evaluation Harness (Build-Order Step 12)
 *
 * Grades the system against the 200 synthetic cases after the simulation has run.
 * Outputs metrics defined in 03_IMPLEMENTATION_PLAN.md §3.
 */

import { getServerClient } from '../src/infra/supabase-server-client';

async function runEvaluation() {
  const db = getServerClient();

  console.log('--- Evaluation Harness ---');
  console.log('Fetching final state of all cases...\n');

  const { data: cases } = await db.from('recovery_cases').select(`
    id, state, escalation_level, closure_reason,
    invoices ( invoice_number, original_amount, outstanding_amount ),
    commitments ( id, status, is_frozen )
  `);

  if (!cases || cases.length === 0) {
    console.error('No cases found. Did you run the simulation?');
    process.exit(1);
  }

  let totalAtRisk = 0;
  let totalRecovered = 0;
  
  let promiseCount = 0;
  let promiseKeptCount = 0;
  
  let disputeCount = 0;
  let correctDisputeHandling = 0;

  for (const c of cases) {
    const inv = c.invoices as any;
    const scenario = inv.invoice_number.split('-').pop();

    totalAtRisk += inv.original_amount;
    totalRecovered += (inv.original_amount - inv.outstanding_amount);

    const hasPromise = c.commitments && c.commitments.length > 0;
    if (hasPromise) {
      promiseCount++;
      const kept = (c.commitments as any[]).some(com => com.status === 'KEPT');
      if (kept) promiseKeptCount++;
    }

    if (scenario === 'PROMISE_THEN_DISPUTE') {
      disputeCount++;
      // Correctness criteria: Case ended up in DISPUTE_OPEN or was closed properly,
      // and the commitment was frozen (if it's still active)
      if (c.state === 'DISPUTE_OPEN') {
        const activeCommitment = (c.commitments as any[]).find(com => com.status === 'VALID_ACTIVE');
        if (activeCommitment && activeCommitment.is_frozen) {
          correctDisputeHandling++;
        }
      }
    }
  }

  const recoveryRate = (totalRecovered / totalAtRisk) * 100;
  const promiseKeptRate = promiseCount > 0 ? (promiseKeptCount / promiseCount) * 100 : 0;
  const disputeCorrectness = disputeCount > 0 ? (correctDisputeHandling / disputeCount) * 100 : 0;

  console.log(`1. Recovery Rate: ₹${totalRecovered.toLocaleString()} / ₹${totalAtRisk.toLocaleString()} (${recoveryRate.toFixed(1)}%)`);
  console.log(`2. Promise Kept Rate: ${promiseKeptCount} / ${promiseCount} (${promiseKeptRate.toFixed(1)}%)`);
  console.log(`3. Dispute-Handling Correctness: ${correctDisputeHandling} / ${disputeCount} (${disputeCorrectness.toFixed(1)}%)`);
  
  // Note: False-escalation and other AI-specific metrics require parsing the audit log
  // in depth. This MVP eval covers the primary business invariants.
  console.log('\nEvaluation complete.');
}

// Run if called directly
if (require.main === module) {
  runEvaluation().catch((err) => {
    console.error('Fatal error during evaluation:', err);
    process.exit(1);
  });
}
