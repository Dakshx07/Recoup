/**
 * Simulation Runner (Exact Schema Adherence)
 *
 * Populates complete 45-day simulated case histories in under 2 seconds.
 */

import { getServerClient } from '../src/infra/supabase-server-client';
import { v4 as uuidv4 } from 'uuid';

const START_DATE = new Date('2026-01-01T09:00:00+05:30');

const INTRA_DAY_OFFSETS = [
  { h: 9, m: 14 }, { h: 9, m: 38 }, { h: 10, m: 5 }, { h: 10, m: 42 },
  { h: 11, m: 18 }, { h: 11, m: 47 }, { h: 12, m: 22 }, { h: 13, m: 8 },
  { h: 14, m: 15 }, { h: 14, m: 51 }, { h: 15, m: 26 }, { h: 15, m: 57 },
  { h: 16, m: 33 }, { h: 17, m: 4 }, { h: 17, m: 41 }, { h: 18, m: 12 },
];

function getSimTime(dayNumber: number, eventIndex: number): string {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + dayNumber - 1);
  const offset = INTRA_DAY_OFFSETS[eventIndex % INTRA_DAY_OFFSETS.length];
  d.setHours(offset.h, offset.m, 0, 0);
  return d.toISOString();
}

function getScenario(contactRef: string): string {
  const match = contactRef.match(/^scenario:([^:]+):/);
  return match ? match[1].toUpperCase() : 'UNKNOWN';
}

async function runSimulation() {
  const db = getServerClient();
  console.log('Running schema-accurate instant simulation...');

  const { data: invoices } = await db.from('invoices').select(`
    id, invoice_number, outstanding_amount, original_amount,
    debtors ( contact_ref, name )
  `);

  if (!invoices || invoices.length === 0) {
    console.error('No invoices found. Run npm run generate-synthetic-data first.');
    process.exit(1);
  }

  console.log('Clearing previous simulation tables...');
  await db.from('audit_events').delete().neq('id', 0);
  await db.from('commitments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('payment_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('reply_parses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('debtor_replies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('outreach_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('recovery_cases').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const casesToInsert: any[] = [];
  const debtorRepliesToInsert: any[] = [];
  const replyParsesToInsert: any[] = [];
  const commitmentsToInsert: any[] = [];
  const paymentsToInsert: any[] = [];
  const auditEventsToInsert: any[] = [];
  const invoiceUpdates: { id: string; outstanding_amount: number; status: string }[] = [];

  let eventIdx = 0;

  for (const inv of invoices) {
    const caseId = uuidv4();
    const contactRef = (inv.debtors as any)?.contact_ref || '';
    const scenario = getScenario(contactRef);
    const day1Time = getSimTime(1, eventIdx++);
    const day3Time = getSimTime(3, eventIdx);
    const amount = Number(inv.outstanding_amount) || 10000;

    // Initial audit event (Case Opened)
    auditEventsToInsert.push({
      entity_type: 'recovery_case',
      entity_id: caseId,
      actor: 'system',
      event_type: 'case_opened',
      new_state: 'AWAITING_REPLY',
      reason: 'Recovery case opened for overdue invoice',
      simulated_time: day1Time,
      real_wall_clock_time: new Date().toISOString(),
    });

    if (scenario === 'CLEAN_PROMISE') {
      const day10Time = getSimTime(10, eventIdx);
      const commitId = uuidv4();
      const payId = uuidv4();
      const replyId = uuidv4();
      const parseId = uuidv4();

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: `We will process payment of full balance ₹${amount.toLocaleString('en-IN')} by Jan 10.`,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence: 0.96,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY', amount, date: '2026-01-10' },
        created_at: day3Time,
      });

      commitmentsToInsert.push({
        id: commitId,
        recovery_case_id: caseId,
        source_reply_parse_id: parseId,
        promised_amount: amount,
        promised_date: '2026-01-10',
        status: 'KEPT',
        is_frozen: false,
        validated_by: 'policy_engine',
        validation_reason: 'Promise validated: within 90-day horizon and full invoice amount',
        resolved_at: day10Time,
        created_at: day3Time,
      });

      paymentsToInsert.push({
        id: payId,
        invoice_id: inv.id,
        external_payment_id: `pay_clean_${payId.slice(0, 8)}`,
        amount: amount,
        paid_at: day10Time,
        verified_at: day10Time,
        verification_source: 'webhook_plus_api_check',
        raw_webhook_payload: { scenario: 'clean_promise' },
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'CLOSED_PAID',
        escalation_level: 'NONE',
        closed_at: day10Time,
        closure_reason: 'Promise kept — full payment received',
        opened_at: day1Time,
        updated_at: day10Time,
      });

      invoiceUpdates.push({ id: inv.id, outstanding_amount: 0, status: 'CLOSED_PAID' });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `Promise validated by Policy Engine: ₹${amount.toLocaleString('en-IN')} due 2026-01-10`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'payment_verifier',
        event_type: 'commitment_kept',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'CLOSED_PAID',
        reason: `Full payment verified: ₹${amount.toLocaleString('en-IN')}`,
        simulated_time: day10Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'BROKEN_PROMISE') {
      const day11Time = getSimTime(11, eventIdx);
      const commitId = uuidv4();
      const replyId = uuidv4();
      const parseId = uuidv4();

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: `Will clear the invoice on 10th January.`,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence: 0.92,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY', amount, date: '2026-01-10' },
        created_at: day3Time,
      });

      commitmentsToInsert.push({
        id: commitId,
        recovery_case_id: caseId,
        source_reply_parse_id: parseId,
        promised_amount: amount,
        promised_date: '2026-01-10',
        status: 'BROKEN',
        is_frozen: false,
        validated_by: 'policy_engine',
        validation_reason: 'Promise validated: within 90-day horizon',
        resolved_at: day11Time,
        created_at: day3Time,
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'ESCALATED',
        escalation_level: 'HUMAN_REVIEW',
        escalation_reason: 'Broken promise — payment window elapsed',
        escalated_at: day11Time,
        opened_at: day1Time,
        updated_at: day11Time,
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `Promise registered: ₹${amount.toLocaleString('en-IN')}`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_broken',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'ESCALATED',
        reason: 'Payment due date passed without settlement — escalated to Human Review',
        simulated_time: day11Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'PROMISE_THEN_DISPUTE') {
      const day5Time = getSimTime(5, eventIdx);
      const commitId = uuidv4();
      const reply1Id = uuidv4();
      const parse1Id = uuidv4();
      const reply2Id = uuidv4();
      const parse2Id = uuidv4();

      debtorRepliesToInsert.push({
        id: reply1Id,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${reply1Id.slice(0, 8)}`,
        raw_content: `I promise to pay by Jan 10.`,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parse1Id,
        debtor_reply_id: reply1Id,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence: 0.95,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY' },
        created_at: day3Time,
      });

      debtorRepliesToInsert.push({
        id: reply2Id,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${reply2Id.slice(0, 8)}`,
        raw_content: `Actually I am disputing line item charges on this invoice.`,
        received_at: day5Time,
      });

      replyParsesToInsert.push({
        id: parse2Id,
        debtor_reply_id: reply2Id,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'DISPUTE_CANDIDATE',
        confidence: 0.98,
        extracted_amount: null,
        extracted_date: null,
        schema_valid: true,
        raw_model_output: { intent: 'DISPUTE', reason: 'Line items incorrect' },
        created_at: day5Time,
      });

      commitmentsToInsert.push({
        id: commitId,
        recovery_case_id: caseId,
        source_reply_parse_id: parse1Id,
        promised_amount: amount,
        promised_date: '2026-01-10',
        status: 'VALID_ACTIVE',
        is_frozen: true, // FROZEN, NOT CANCELLED
        validated_by: 'policy_engine',
        validation_reason: 'Dispute raised — frozen pending reviewer determination',
        created_at: day3Time,
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'DISPUTE_OPEN',
        escalation_level: 'NONE',
        opened_at: day1Time,
        updated_at: day5Time,
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: 'Promise registered',
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'dispute_detected_commitment_frozen',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'DISPUTE_OPEN',
        reason: 'Debtor disputed invoice — active commitment FROZEN (preserved, not cancelled) awaiting human review',
        simulated_time: day5Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'DIRECT_DISPUTE') {
      const replyId = uuidv4();
      const parseId = uuidv4();

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: `We dispute this invoice entirely. Goods were damaged.`,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'DISPUTE_CANDIDATE',
        confidence: 0.97,
        schema_valid: true,
        raw_model_output: { intent: 'DISPUTE', reason: 'Damaged goods' },
        created_at: day3Time,
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'DISPUTE_OPEN',
        escalation_level: 'NONE',
        opened_at: day1Time,
        updated_at: day3Time,
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'dispute_raised',
        previous_state: 'AWAITING_REPLY',
        new_state: 'DISPUTE_OPEN',
        reason: 'Debtor disputed invoice upon initial contact — flagged for verification',
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'GHOST') {
      const day17Time = getSimTime(17, eventIdx);
      const day20Time = getSimTime(20, eventIdx);

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'ESCALATED',
        escalation_level: 'COLLECTIONS_HANDOFF',
        escalation_reason: 'Ghosted — 3 outreach attempts with zero debtor response',
        escalated_at: day20Time,
        opened_at: day1Time,
        updated_at: day20Time,
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'case_ghosted',
        previous_state: 'AWAITING_REPLY',
        new_state: 'GHOSTED',
        reason: 'Outreach frequency cap reached with no debtor response',
        simulated_time: day17Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'escalation_raised',
        previous_state: 'GHOSTED',
        new_state: 'ESCALATED',
        reason: 'Day 14 trigger elapsed — handed off to legal collections',
        simulated_time: day20Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'AMBIGUOUS') {
      const replyId = uuidv4();
      const parseId = uuidv4();

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: `Let me check with accounts team sometime soon.`,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'AMBIGUOUS',
        confidence: 0.54,
        schema_valid: true,
        raw_model_output: { intent: 'AMBIGUOUS' },
        created_at: day3Time,
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'AWAITING_REPLY',
        escalation_level: 'NONE',
        opened_at: day1Time,
        updated_at: day3Time,
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed_ambiguous',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: 'LLM confidence 0.54 < 0.70 threshold — clarification prompt sent to debtor',
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'PARTIAL_PAYMENT') {
      const day12Time = getSimTime(12, eventIdx);
      const commitId = uuidv4();
      const payId = uuidv4();
      const replyId = uuidv4();
      const parseId = uuidv4();
      const partialAmt = Math.round(amount * 0.6);

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: `We will settle ₹${amount.toLocaleString('en-IN')} by Jan 10.`,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence: 0.95,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY' },
        created_at: day3Time,
      });

      commitmentsToInsert.push({
        id: commitId,
        recovery_case_id: caseId,
        source_reply_parse_id: parseId,
        promised_amount: amount,
        promised_date: '2026-01-10',
        status: 'PARTIALLY_KEPT',
        is_frozen: false,
        validated_by: 'policy_engine',
        validation_reason: '60% partial payment verified against active commitment',
        resolved_at: day12Time,
        created_at: day3Time,
      });

      paymentsToInsert.push({
        id: payId,
        invoice_id: inv.id,
        external_payment_id: `pay_part_${payId.slice(0, 8)}`,
        amount: partialAmt,
        paid_at: day12Time,
        verified_at: day12Time,
        verification_source: 'webhook_plus_api_check',
        raw_webhook_payload: { scenario: 'partial' },
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'CLOSED_PARTIAL',
        escalation_level: 'NONE',
        closed_at: day12Time,
        closure_reason: 'Settled with partial payment',
        opened_at: day1Time,
        updated_at: day12Time,
      });

      invoiceUpdates.push({ id: inv.id, outstanding_amount: amount - partialAmt, status: 'CLOSED_PARTIAL' });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'payment_verifier',
        event_type: 'commitment_partially_kept',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'CLOSED_PARTIAL',
        reason: `Partial payment of ₹${partialAmt.toLocaleString('en-IN')} verified (60%)`,
        simulated_time: day12Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'UNPROMPTED_PAYMENT') {
      const payId = uuidv4();

      paymentsToInsert.push({
        id: payId,
        invoice_id: inv.id,
        external_payment_id: `pay_unp_${payId.slice(0, 8)}`,
        amount: amount,
        paid_at: day3Time,
        verified_at: day3Time,
        verification_source: 'webhook_plus_api_check',
        raw_webhook_payload: { scenario: 'unprompted' },
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'CLOSED_PAID',
        escalation_level: 'NONE',
        closed_at: day3Time,
        closure_reason: 'Full payment received without negotiation',
        opened_at: day1Time,
        updated_at: day3Time,
      });

      invoiceUpdates.push({ id: inv.id, outstanding_amount: 0, status: 'CLOSED_PAID' });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'payment_verifier',
        event_type: 'payment_verified',
        previous_state: 'AWAITING_REPLY',
        new_state: 'CLOSED_PAID',
        reason: `Unprompted full payment verified: ₹${amount.toLocaleString('en-IN')}`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    }
  }

  // Batched Inserts with error logging
  const BATCH_SIZE = 50;

  console.log(`Writing ${casesToInsert.length} cases...`);
  for (let i = 0; i < casesToInsert.length; i += BATCH_SIZE) {
    const slice = casesToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('recovery_cases').insert(slice);
    if (error) console.error('Case insert error:', error.message);
  }

  console.log(`Writing ${debtorRepliesToInsert.length} debtor replies...`);
  for (let i = 0; i < debtorRepliesToInsert.length; i += BATCH_SIZE) {
    const slice = debtorRepliesToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('debtor_replies').insert(slice);
    if (error) console.error('Debtor reply insert error:', error.message);
  }

  console.log(`Writing ${replyParsesToInsert.length} reply parses...`);
  for (let i = 0; i < replyParsesToInsert.length; i += BATCH_SIZE) {
    const slice = replyParsesToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('reply_parses').insert(slice);
    if (error) console.error('Reply parse insert error:', error.message);
  }

  console.log(`Writing ${commitmentsToInsert.length} commitments...`);
  for (let i = 0; i < commitmentsToInsert.length; i += BATCH_SIZE) {
    const slice = commitmentsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('commitments').insert(slice);
    if (error) console.error('Commitment insert error:', error.message);
  }

  console.log(`Writing ${paymentsToInsert.length} payments...`);
  for (let i = 0; i < paymentsToInsert.length; i += BATCH_SIZE) {
    const slice = paymentsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('payments').insert(slice);
    if (error) console.error('Payment insert error:', error.message);
  }

  console.log(`Writing ${auditEventsToInsert.length} audit events...`);
  for (let i = 0; i < auditEventsToInsert.length; i += BATCH_SIZE) {
    const slice = auditEventsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('audit_events').insert(slice);
    if (error) console.error('Audit insert error:', error.message);
  }

  // Invoice updates in batch slices
  for (const invUp of invoiceUpdates) {
    await db.from('invoices').update({ outstanding_amount: invUp.outstanding_amount, status: invUp.status }).eq('id', invUp.id);
  }

  console.log(`\n✓ Single-pass instant simulation completed!`);
}

if (require.main === module) {
  runSimulation().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
