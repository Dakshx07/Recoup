/**
 * Simulation Runner (Build-Order Steps 11 & 12)
 *
 * Simulates 45 days of business time in a few seconds.
 * For each simulated day:
 * 1. Advances the SimulatedClock
 * 2. Runs CronService (escalations, stopping rules, broken promises)
 * 3. Injects synthetic debtor behaviors (replies, payments) based on the case scenario
 */

import { getServerClient } from '../src/infra/supabase-server-client';
import { SimulatedClock } from '../src/domain/clock/simulated-clock';
import { CronService } from '../src/services/cron.service';
import { StateTransitionService } from '../src/services/state-transition.service';
import { PaymentVerifier } from '../src/services/payment-verifier';
import { RecoveryCaseState } from '../src/domain/state-machine/recovery-case.states';
import { v4 as uuidv4 } from 'uuid';

const SIMULATION_DAYS = 45;
const START_DATE = new Date('2026-01-01T09:00:00Z');

async function runSimulation() {
  const db = getServerClient();
  const clock = new SimulatedClock(START_DATE);
  const stateTransition = new StateTransitionService(db, clock);
  const cronService = new CronService(db, stateTransition, clock);
  const paymentVerifier = new PaymentVerifier(db, stateTransition);

  console.log(`Starting simulation for ${SIMULATION_DAYS} days...`);

  // 1. Kick off cases
  // All invoices should have an open case in OPEN_UNREACHED
  const { data: invoices } = await db.from('invoices').select('id, invoice_number, outstanding_amount');
  
  if (!invoices || invoices.length === 0) {
    console.error('No invoices found. Did you run the synthetic data generator?');
    process.exit(1);
  }

  console.log('Cleaning up previous simulation state...');
  await db.from('audit_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('commitments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('recovery_cases').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log(`Spawning ${invoices.length} recovery cases...`);
  for (const inv of invoices) {
    const { error } = await db.from('recovery_cases').insert({
      id: uuidv4(),
      invoice_id: inv.id,
      state: 'AWAITING_REPLY',
      escalation_level: 'NONE',
    });
    if (error) {
      console.error('Failed to spawn case:', error);
    }
  }

  // 2. The main simulation loop
  for (let day = 1; day <= SIMULATION_DAYS; day++) {
    clock.advanceByDays(1); // Advance 1 day
    console.log(`\n--- Day ${day} (${clock.now().toISOString().split('T')[0]}) ---`);

    // A. Scheduled Checks
    const cronResult = await cronService.runHourlyChecks();
    console.log(`Cron: ${cronResult.processed} checked | ${cronResult.escalated} escalated | ${cronResult.brokenPromises} broken promises | ${cronResult.writtenOff} written off`);

    // B. Inject Synthetic Debtor Behavior
    // We look at all currently open cases and decide if the debtor does something today
    const { data: openCases } = await db.from('recovery_cases')
      .select('id, state, invoice_id, invoices(invoice_number, outstanding_amount)')
      .is('closed_at', null);

    if (!openCases) continue;

    let behaviorCount = 0;
    for (const c of openCases) {
      const inv = c.invoices as any;
      const scenario = inv.invoice_number.split('-').pop(); // e.g., CLEAN_PROMISE

      // Deterministic trigger: e.g., on Day 3, everyone except GHOST replies
      if (day === 3 && scenario !== 'GHOST' && c.state === 'AWAITING_REPLY') {
        // Debtor replied
        await stateTransition.transitionCase({
          caseId: c.id,
          newState: RecoveryCaseState.REPLY_PROCESSING,
          actor: 'system',
          eventType: 'debtor_reply_received',
          reason: 'Synthetic debtor reply received',
        });
        
        if (scenario === 'CLEAN_PROMISE' || scenario === 'BROKEN_PROMISE' || scenario === 'PROMISE_THEN_DISPUTE') {
          // Promise to pay in 7 days
          const dueDate = new Date(clock.now());
          dueDate.setDate(dueDate.getDate() + 7);
          
          await db.from('commitments').insert({
            id: uuidv4(),
            recovery_case_id: c.id,
            amount: inv.outstanding_amount,
            due_date: dueDate.toISOString(),
            status: 'VALID_ACTIVE',
          });
          
          await stateTransition.transitionCase({
            caseId: c.id,
            newState: RecoveryCaseState.COMMITMENT_ACTIVE,
            actor: 'policy_engine',
            eventType: 'commitment_established',
            reason: 'Synthetic valid promise established',
          });
          behaviorCount++;
        }
      }

      // Payments
      if (scenario === 'CLEAN_PROMISE' && c.state === 'COMMITMENT_ACTIVE' && day === 10) {
        // Mock a webhook payment
        const linkRes = await db.from('payment_links').insert({ invoice_id: inv.id, external_link_id: `plink_${inv.id}` }).select().single();
        if (linkRes.data) {
          await paymentVerifier.processWebhook({
            payment_link_id: linkRes.data.external_link_id,
            payment_id: `pay_${uuidv4()}`,
            amount_paid: inv.outstanding_amount,
            currency: 'INR',
            status: 'captured'
          });
          behaviorCount++;
        }
      }
      
      // Disputes
      if (scenario === 'PROMISE_THEN_DISPUTE' && c.state === 'COMMITMENT_ACTIVE' && day === 5) {
        // Raise a dispute
        await stateTransition.transitionCase({
          caseId: c.id,
          newState: RecoveryCaseState.DISPUTE_OPEN,
          actor: 'human',
          eventType: 'dispute_raised',
          reason: 'Debtor disputed the invoice amount',
        });
        behaviorCount++;
      }
    }
    
    if (behaviorCount > 0) {
      console.log(`Synthetic injections: ${behaviorCount} behaviors simulated`);
    }
  }

  console.log('\nSimulation complete!');
}

// Run if called directly
if (require.main === module) {
  runSimulation().catch((err) => {
    console.error('Fatal error during simulation:', err);
    process.exit(1);
  });
}
