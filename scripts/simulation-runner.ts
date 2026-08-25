/**
 * Simulation Runner (Comprehensive Multi-Step LLM & Audit Trail)
 *
 * Populates complete 45-day simulated case histories in under 2 seconds.
 *
 * Features:
 * - Full 6-step causal chain visible in Case Detail:
 *   system (case_opened) -> system (debtor_reply_received) -> llm (reply_parsed) -> policy_engine (decision)
 * - Exact dispute resolution freeze-not-cancel edge case demonstration
 * - Natural intra-day timestamp distribution per event with dual timestamp recording
 * - Case-specific audit event reason strings (interpolating invoice numbers & debtor details)
 * - Naturally varying confidence scores per LLM parse (e.g. 94.2% – 98.6%)
 */

import { getServerClient } from '../src/infra/supabase-server-client';
import { v4 as uuidv4 } from 'uuid';

const START_DATE = new Date('2026-01-01T09:00:00+05:30');

// Intra-day offsets (distinct minutes and seconds)
const INTRA_DAY_OFFSETS = [
  { h: 9, m: 14, s: 22 }, { h: 9, m: 38, s: 15 }, { h: 10, m: 5, s: 44 }, { h: 10, m: 42, s: 10 },
  { h: 11, m: 18, s: 50 }, { h: 11, m: 47, s: 33 }, { h: 12, m: 22, s: 12 }, { h: 13, m: 8, s: 5 },
  { h: 14, m: 15, s: 40 }, { h: 14, m: 51, s: 18 }, { h: 15, m: 26, s: 55 }, { h: 15, m: 57, s: 30 },
  { h: 16, m: 33, s: 45 }, { h: 17, m: 4, s: 20 }, { h: 17, m: 41, s: 10 }, { h: 18, m: 12, s: 58 },
];

function getSimTime(dayNumber: number, eventIndex: number, minuteOffset = 0): string {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + dayNumber - 1);
  const offset = INTRA_DAY_OFFSETS[eventIndex % INTRA_DAY_OFFSETS.length];
  d.setHours(offset.h, (offset.m + (eventIndex % 11) + minuteOffset) % 60, offset.s, 0);
  return d.toISOString();
}

function getScenario(contactRef: string): string {
  const match = contactRef.match(/^scenario:([^:]+):/);
  return match ? match[1].toUpperCase() : 'UNKNOWN';
}

async function runSimulation() {
  const db = getServerClient();
  console.log('Running schema-accurate instant simulation with complete LLM parse chains...');

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
    const debtorName = (inv.debtors as any)?.name || 'Debtor';
    const contactRef = (inv.debtors as any)?.contact_ref || '';
    const scenario = getScenario(contactRef);
    const day1Time = getSimTime(1, eventIdx);
    const day3Time = getSimTime(3, eventIdx);
    const amount = Number(inv.outstanding_amount) || 10000;
    const invNum = inv.invoice_number;

    // Step 1: Case Opened (System)
    auditEventsToInsert.push({
      entity_type: 'recovery_case',
      entity_id: caseId,
      actor: 'system',
      event_type: 'case_opened',
      new_state: 'AWAITING_REPLY',
      reason: `Case opened for ${invNum} (${debtorName}) — ₹${amount.toLocaleString('en-IN')} overdue`,
      simulated_time: day1Time,
      real_wall_clock_time: new Date().toISOString(),
    });

    if (scenario === 'CLEAN_PROMISE') {
      const day10Time = getSimTime(10, eventIdx);
      const commitId = uuidv4();
      const payId = uuidv4();
      const replyId = uuidv4();
      const parseId = uuidv4();
      const confidence = Number((0.94 + (eventIdx % 5) * 0.012).toFixed(3));
      const rawMsg = `We will process payment of full balance ₹${amount.toLocaleString('en-IN')} by Jan 10.`;

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: rawMsg,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY', amount, date: '2026-01-10' },
        created_at: getSimTime(3, eventIdx, 1),
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
        validation_reason: `Promise validated: within 90-day horizon for ${invNum}`,
        resolved_at: day10Time,
        created_at: getSimTime(3, eventIdx, 2),
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
        closure_reason: 'Promise kept — full payment received on schedule',
        opened_at: day1Time,
        updated_at: day10Time,
      });

      invoiceUpdates.push({ id: inv.id, outstanding_amount: 0, status: 'CLOSED_PAID' });

      // Step 2: Inbound Debtor Reply Received (System)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawMsg}"`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      // Step 3: Structured LLM Reply Parse (LLM)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Structured intent PROMISE_CANDIDATE (confidence: ${(confidence * 100).toFixed(1)}%) — extracted ₹${amount.toLocaleString('en-IN')} due 2026-01-10`,
        details: { model: 'gemini-2.0-flash', intent: 'PROMISE_TO_PAY', confidence, extracted_amount: amount, extracted_date: '2026-01-10' },
        simulated_time: getSimTime(3, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });

      // Step 4: Policy Engine Validates Commitment (Policy Engine)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `[${invNum}] Promise validated by Policy Engine: ₹${amount.toLocaleString('en-IN')} due 2026-01-10`,
        simulated_time: getSimTime(3, eventIdx, 2),
        real_wall_clock_time: new Date().toISOString(),
      });

      // Step 5: Webhook Payment Verified (Payment Verifier)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'payment_verifier',
        event_type: 'commitment_kept',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'CLOSED_PAID',
        reason: `[${invNum}] Webhook + API verified settlement of ₹${amount.toLocaleString('en-IN')} on schedule`,
        simulated_time: day10Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'BROKEN_PROMISE') {
      const day11Time = getSimTime(11, eventIdx);
      const commitId = uuidv4();
      const replyId = uuidv4();
      const parseId = uuidv4();
      const confidence = Number((0.92 + (eventIdx % 4) * 0.015).toFixed(3));
      const rawMsg = `Will clear the invoice on 10th January.`;

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: rawMsg,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY', amount, date: '2026-01-10' },
        created_at: getSimTime(3, eventIdx, 1),
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
        validation_reason: `Promise registered for ${invNum}`,
        resolved_at: day11Time,
        created_at: getSimTime(3, eventIdx, 2),
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'ESCALATED',
        escalation_level: 'HUMAN_REVIEW',
        escalation_reason: 'Broken promise — payment window elapsed with zero settlement',
        escalated_at: day11Time,
        opened_at: day1Time,
        updated_at: day11Time,
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawMsg}"`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Structured intent PROMISE_CANDIDATE (confidence: ${(confidence * 100).toFixed(1)}%) — extracted ₹${amount.toLocaleString('en-IN')} due 2026-01-10`,
        details: { model: 'gemini-2.0-flash', intent: 'PROMISE_TO_PAY', confidence, extracted_amount: amount, extracted_date: '2026-01-10' },
        simulated_time: getSimTime(3, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `[${invNum}] Promise registered for ${debtorName}: ₹${amount.toLocaleString('en-IN')}`,
        simulated_time: getSimTime(3, eventIdx, 2),
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_broken',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'ESCALATED',
        reason: `[${invNum}] Due date 2026-01-10 passed without payment — escalated to Human Review`,
        simulated_time: day11Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'PROMISE_THEN_DISPUTE') {
      // Required Edge Case: Full 6-Step Causal Chain
      const day5Time = getSimTime(5, eventIdx);
      const commitId = uuidv4();
      const reply1Id = uuidv4();
      const parse1Id = uuidv4();
      const reply2Id = uuidv4();
      const parse2Id = uuidv4();
      const rawPromiseMsg = `We will process payment of ₹${amount.toLocaleString('en-IN')} by Jan 10.`;
      const rawDisputeMsg = `Actually we are disputing line item charges on invoice ${invNum}. Services were not delivered in full.`;

      debtorRepliesToInsert.push({
        id: reply1Id,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${reply1Id.slice(0, 8)}`,
        raw_content: rawPromiseMsg,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parse1Id,
        debtor_reply_id: reply1Id,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence: 0.952,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY', amount, date: '2026-01-10' },
        created_at: getSimTime(3, eventIdx, 1),
      });

      debtorRepliesToInsert.push({
        id: reply2Id,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${reply2Id.slice(0, 8)}`,
        raw_content: rawDisputeMsg,
        received_at: day5Time,
      });

      replyParsesToInsert.push({
        id: parse2Id,
        debtor_reply_id: reply2Id,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'DISPUTE_CANDIDATE',
        confidence: 0.984,
        extracted_amount: null,
        extracted_date: null,
        schema_valid: true,
        raw_model_output: { intent: 'DISPUTE', reason: 'Line items incorrect / services undelivered' },
        created_at: getSimTime(5, eventIdx, 1),
      });

      commitmentsToInsert.push({
        id: commitId,
        recovery_case_id: caseId,
        source_reply_parse_id: parse1Id,
        promised_amount: amount,
        promised_date: '2026-01-10',
        status: 'VALID_ACTIVE',
        is_frozen: true, // FROZEN, NOT CANCELLED per locked spec
        validated_by: 'policy_engine',
        validation_reason: `Dispute raised on ${invNum} — commitment frozen pending reviewer determination`,
        created_at: getSimTime(3, eventIdx, 2),
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'DISPUTE_OPEN',
        escalation_level: 'NONE',
        opened_at: day1Time,
        updated_at: getSimTime(5, eventIdx, 2),
      });

      // Chain Step 2: Debtor promises payment (System)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawPromiseMsg}"`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      // Chain Step 3: LLM parses promise (LLM)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Structured intent PROMISE_CANDIDATE (confidence: 95.2%) — extracted ₹${amount.toLocaleString('en-IN')} due 2026-01-10`,
        details: { model: 'gemini-2.0-flash', intent: 'PROMISE_TO_PAY', confidence: 0.952, extracted_amount: amount, extracted_date: '2026-01-10' },
        simulated_time: getSimTime(3, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });

      // Chain Step 4: Policy Engine validates active commitment (Policy Engine)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `[${invNum}] Promise registered for ₹${amount.toLocaleString('en-IN')} due 2026-01-10 — state advanced to COMMITMENT_ACTIVE`,
        simulated_time: getSimTime(3, eventIdx, 2),
        real_wall_clock_time: new Date().toISOString(),
      });

      // Chain Step 5: Debtor raises dispute (System)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawDisputeMsg}"`,
        simulated_time: day5Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      // Chain Step 6: LLM parses dispute (LLM)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `[${invNum}] Structured intent DISPUTE_CANDIDATE (confidence: 98.4%) — grounds: services undelivered / invoice charges disputed`,
        details: { model: 'gemini-2.0-flash', intent: 'DISPUTE', confidence: 0.984, reason: 'Line items incorrect' },
        simulated_time: getSimTime(5, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });

      // Chain Step 7: Policy Engine enforces Dispute Freeze Rule (Policy Engine)
      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'dispute_detected_commitment_frozen',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'DISPUTE_OPEN',
        reason: `[${invNum}] Debtor disputed charges — active commitment of ₹${amount.toLocaleString('en-IN')} FROZEN (preserved, not cancelled) per Dispute-Freeze rule. Case moved to DISPUTE_OPEN awaiting human reviewer determination.`,
        simulated_time: getSimTime(5, eventIdx, 2),
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'DIRECT_DISPUTE') {
      const replyId = uuidv4();
      const parseId = uuidv4();
      const confidence = Number((0.965 + (eventIdx % 4) * 0.009).toFixed(3));
      const rawMsg = `We dispute this invoice ${invNum} entirely. Goods delivered were non-conforming.`;

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: rawMsg,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'DISPUTE_CANDIDATE',
        confidence,
        schema_valid: true,
        raw_model_output: { intent: 'DISPUTE', reason: 'Non-conforming goods' },
        created_at: getSimTime(3, eventIdx, 1),
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'DISPUTE_OPEN',
        escalation_level: 'NONE',
        opened_at: day1Time,
        updated_at: getSimTime(3, eventIdx, 2),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawMsg}"`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Structured intent DISPUTE_CANDIDATE (confidence: ${(confidence * 100).toFixed(1)}%) — grounds: non-conforming goods`,
        details: { model: 'gemini-2.0-flash', intent: 'DISPUTE', confidence, reason: 'Non-conforming goods' },
        simulated_time: getSimTime(3, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'dispute_raised',
        previous_state: 'AWAITING_REPLY',
        new_state: 'DISPUTE_OPEN',
        reason: `[${invNum}] Debtor ${debtorName} disputed invoice upon initial contact — state moved to DISPUTE_OPEN for reviewer determination`,
        simulated_time: getSimTime(3, eventIdx, 2),
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
        escalation_reason: `Ghosted — 3 outreach attempts with zero debtor response on ${invNum}`,
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
        reason: `[${invNum}] Outreach frequency cap reached (3 touches) for ${debtorName} with zero response`,
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
        reason: `[${invNum}] Day 14 trigger elapsed — handed off to Collections Handoff`,
        simulated_time: day20Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'AMBIGUOUS') {
      const replyId = uuidv4();
      const parseId = uuidv4();
      const confidence = Number((0.52 + (eventIdx % 6) * 0.024).toFixed(3));
      const rawMsg = `Let me check with accounts team sometime next week.`;

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: rawMsg,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'AMBIGUOUS',
        confidence,
        schema_valid: true,
        raw_model_output: { intent: 'AMBIGUOUS' },
        created_at: getSimTime(3, eventIdx, 1),
      });

      casesToInsert.push({
        id: caseId,
        invoice_id: inv.id,
        state: 'AWAITING_REPLY',
        escalation_level: 'NONE',
        opened_at: day1Time,
        updated_at: getSimTime(3, eventIdx, 2),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawMsg}"`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed_ambiguous',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] LLM confidence ${(confidence * 100).toFixed(1)}% < 70% threshold — clarification prompt queued`,
        details: { model: 'gemini-2.0-flash', intent: 'AMBIGUOUS', confidence },
        simulated_time: getSimTime(3, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });
    } else if (scenario === 'PARTIAL_PAYMENT') {
      const day12Time = getSimTime(12, eventIdx);
      const commitId = uuidv4();
      const payId = uuidv4();
      const replyId = uuidv4();
      const parseId = uuidv4();
      const partialAmt = Math.round(amount * 0.6);
      const rawMsg = `We will settle ₹${amount.toLocaleString('en-IN')} by Jan 10.`;

      debtorRepliesToInsert.push({
        id: replyId,
        recovery_case_id: caseId,
        channel: 'email',
        external_message_id: `msg_${replyId.slice(0, 8)}`,
        raw_content: rawMsg,
        received_at: day3Time,
      });

      replyParsesToInsert.push({
        id: parseId,
        debtor_reply_id: replyId,
        model_version: 'gemini-2.0-flash',
        parsed_intent_type: 'PROMISE_CANDIDATE',
        confidence: 0.948,
        extracted_amount: amount,
        extracted_date: '2026-01-10',
        schema_valid: true,
        raw_model_output: { intent: 'PROMISE_TO_PAY' },
        created_at: getSimTime(3, eventIdx, 1),
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
        validation_reason: `60% partial payment verified for ${invNum}`,
        resolved_at: day12Time,
        created_at: getSimTime(3, eventIdx, 2),
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
        actor: 'system',
        event_type: 'debtor_reply_received',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Inbound email from ${debtorName}: "${rawMsg}"`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'llm',
        event_type: 'reply_parsed',
        previous_state: 'AWAITING_REPLY',
        new_state: 'AWAITING_REPLY',
        reason: `[${invNum}] Structured intent PROMISE_CANDIDATE (confidence: 94.8%) — extracted ₹${amount.toLocaleString('en-IN')} due 2026-01-10`,
        details: { model: 'gemini-2.0-flash', intent: 'PROMISE_TO_PAY', confidence: 0.948, extracted_amount: amount, extracted_date: '2026-01-10' },
        simulated_time: getSimTime(3, eventIdx, 1),
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'policy_engine',
        event_type: 'commitment_validated',
        previous_state: 'AWAITING_REPLY',
        new_state: 'COMMITMENT_ACTIVE',
        reason: `[${invNum}] Promise registered for ₹${amount.toLocaleString('en-IN')}`,
        simulated_time: getSimTime(3, eventIdx, 2),
        real_wall_clock_time: new Date().toISOString(),
      });

      auditEventsToInsert.push({
        entity_type: 'recovery_case',
        entity_id: caseId,
        actor: 'payment_verifier',
        event_type: 'commitment_partially_kept',
        previous_state: 'COMMITMENT_ACTIVE',
        new_state: 'CLOSED_PARTIAL',
        reason: `[${invNum}] Partial payment of ₹${partialAmt.toLocaleString('en-IN')} verified (60%)`,
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
        reason: `[${invNum}] Direct payment verified: ₹${amount.toLocaleString('en-IN')}`,
        simulated_time: day3Time,
        real_wall_clock_time: new Date().toISOString(),
      });
    }

    eventIdx++;
  }

  // Batched Inserts
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
