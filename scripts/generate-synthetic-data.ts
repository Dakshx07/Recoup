/**
 * Synthetic Data Generator (Build-Order Step 9)
 *
 * Populates the database with 200 invoices distributed across 8 specific
 * test scenarios. This forms the basis for the evaluation harness.
 *
 * Scenarios (03_IMPLEMENTATION_PLAN.md §2):
 * 1. Clean promise, kept on time (30%)
 * 2. Broken promise, no dispute (15%)
 * 3. Promise, then dispute within the same window (10%) - The Required Edge Case
 * 4. Direct dispute, no promise ever made (10%)
 * 5. Ghost (no reply at all) (15%)
 * 6. Ambiguous/vague reply (10%)
 * 7. Partial payment against a valid promise (5%)
 * 8. Unprompted direct payment, no negotiation (5%)
 *
 * (Also ~10% cross-cutting duplicate/out-of-order delivery stress test, handled via webhook fuzzing later)
 */

import { getServerClient } from '../src/infra/supabase-server-client';
import { v4 as uuidv4 } from 'uuid';

const TOTAL_INVOICES = 200;

// Distribution
const SCENARIO_DISTRIBUTION = {
  CLEAN_PROMISE: Math.round(TOTAL_INVOICES * 0.30),
  BROKEN_PROMISE: Math.round(TOTAL_INVOICES * 0.15),
  PROMISE_THEN_DISPUTE: Math.round(TOTAL_INVOICES * 0.10),
  DIRECT_DISPUTE: Math.round(TOTAL_INVOICES * 0.10),
  GHOST: Math.round(TOTAL_INVOICES * 0.15),
  AMBIGUOUS: Math.round(TOTAL_INVOICES * 0.10),
  PARTIAL_PAYMENT: Math.round(TOTAL_INVOICES * 0.05),
  UNPROMPTED_PAYMENT: Math.round(TOTAL_INVOICES * 0.05),
};

export type ScenarioType = keyof typeof SCENARIO_DISTRIBUTION;

async function generate() {
  const db = getServerClient();
  console.log('Generating synthetic data...');

  // 1. Create a Merchant
  const merchantId = uuidv4();
  await db.from('merchants').insert({
    id: merchantId,
    name: 'Acme Corp (Synthetic)',
  });
  console.log(`Created merchant ${merchantId}`);

  // 2. Distribute cases
  let debtorsToCreate: any[] = [];
  let invoicesToCreate: any[] = [];
  
  // We'll tag the invoice_number with the scenario for easy filtering in the dashboard/eval
  let invoiceCounter = 1;

  for (const [scenario, count] of Object.entries(SCENARIO_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      const debtorId = uuidv4();
      debtorsToCreate.push({
        id: debtorId,
        merchant_id: merchantId,
        name: `Debtor ${invoiceCounter} (${scenario})`,
        contact_ref: `synthetic_${scenario.toLowerCase()}_${invoiceCounter}@example.com`,
      });

      const amount = Math.floor(Math.random() * 90000) + 10000; // 10k to 100k
      
      invoicesToCreate.push({
        id: uuidv4(),
        merchant_id: merchantId,
        debtor_id: debtorId,
        invoice_number: `INV-${String(invoiceCounter).padStart(4, '0')}-${scenario}`,
        original_amount: amount,
        outstanding_amount: amount,
        currency: 'INR',
        original_due_date: '2026-01-01', // Fixed past date so they are all overdue
        status: 'OVERDUE',
      });
      
      invoiceCounter++;
    }
  }

  // Insert in batches to avoid payload limits
  console.log(`Inserting ${debtorsToCreate.length} debtors...`);
  await db.from('debtors').insert(debtorsToCreate);
  
  console.log(`Inserting ${invoicesToCreate.length} invoices...`);
  await db.from('invoices').insert(invoicesToCreate);

  console.log('Synthetic data generation complete. Run the simulation to spawn recovery cases.');
}

// Run if called directly
if (require.main === module) {
  generate().catch((err) => {
    console.error('Fatal error during data generation:', err);
    process.exit(1);
  });
}
