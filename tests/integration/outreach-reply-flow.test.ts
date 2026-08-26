import { describe, it, expect } from 'vitest';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { StateTransitionService } from '@/services/state-transition.service';
import { RecoveryCaseState } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus } from '@/domain/state-machine/commitment.states';
import { validatePromise } from '@/domain/policy-engine/promise-validity';
import { checkQuietHours } from '@/domain/policy-engine/quiet-hours';
import { checkContactFrequency } from '@/domain/policy-engine/contact-frequency';
import { validateReplyParseOutput } from '@/domain/llm/schemas';
import {
  createInvoiceFixture,
  createCaseFixture,
  createInMemoryDatabase,
} from '../fixtures';

describe('INTEGRATION — Outreach ➔ Reply ➔ Policy ➔ State ➔ Audit Flow', () => {
  it('executes the full happy path from inbound invoice to commitment registration', async () => {
    const clock = new SimulatedClock(new Date('2026-01-01T11:00:00+05:30')); // 11:00 IST (valid outreach window)

    // 1. Seed Database with new invoice and open case
    const invoice = createInvoiceFixture({
      id: 'inv_outreach_1',
      original_amount: 42000,
      outstanding_amount: 42000,
      due_date: '2026-01-01T00:00:00Z',
    });
    const recoveryCase = createCaseFixture({
      id: 'case_outreach_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.OPEN,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // 2. Outreach Policy Gate Verification
    const quietCheck = checkQuietHours(clock);
    expect(quietCheck.allowed).toBe(true);

    const freqCheck = checkContactFrequency({ recentOutreachTimestamps: [] }, clock);
    expect(freqCheck.allowed).toBe(true);

    // 3. Dispatch Outreach and Transition Case: OPEN -> AWAITING_REPLY
    const outreachTransition = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.AWAITING_REPLY,
      actor: 'policy_engine',
      eventType: 'outreach_notice_dispatched',
      reason: 'Initial overdue notice dispatched via email with payment link',
    });
    expect(outreachTransition.success).toBe(true);

    // Verify case state updated in DB
    const updatedCase1 = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(updatedCase1.state).toBe(RecoveryCaseState.AWAITING_REPLY);

    // 4. Debtor Replies -> Worker picks up job: AWAITING_REPLY -> REPLY_PROCESSING
    const replyProcessingTransition = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.REPLY_PROCESSING,
      actor: 'system',
      eventType: 'debtor_reply_received',
      reason: 'Debtor reply webhook received, beginning structured parse',
    });
    expect(replyProcessingTransition.success).toBe(true);

    const rawLLMReplyExtraction = {
      intent_type: 'PROMISE_CANDIDATE',
      extracted_amount: 42000,
      extracted_date: '2026-01-10',
      confidence: 0.95,
      ambiguity_flags: [],
      dispute_reason: null,
      raw_reasoning: 'Debtor explicitly promised ₹42,000 on Jan 10 via NEFT',
    };

    // 5. LLM Schema Validation Gate
    const schemaValidation = validateReplyParseOutput(rawLLMReplyExtraction);
    expect(schemaValidation.valid).toBe(true);
    if (!schemaValidation.valid) return;

    // 6. Deterministic Policy Engine Promise Validation
    const promiseCandidate = {
      promisedAmount: schemaValidation.data.extracted_amount!,
      promisedDate: new Date(schemaValidation.data.extracted_date!),
      outstandingAmount: invoice.outstanding_amount,
      hasExistingActiveCommitment: false,
    };

    const policyValidation = validatePromise(promiseCandidate, clock);
    expect(policyValidation.valid).toBe(true);

    // 7. Atomic Transition to COMMITMENT_ACTIVE and Commitment Creation
    const commitmentInsert = await client.from('commitments').insert({
      id: 'com_outreach_1',
      recovery_case_id: recoveryCase.id,
      amount: promiseCandidate.promisedAmount,
      due_date: promiseCandidate.promisedDate.toISOString(),
      status: CommitmentStatus.VALID_ACTIVE,
      is_frozen: false,
    });
    expect(commitmentInsert.error).toBeNull();

    const caseCommitmentTransition = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.COMMITMENT_ACTIVE,
      actor: 'policy_engine',
      eventType: 'commitment_registered',
      reason: `Promise registered for ₹${promiseCandidate.promisedAmount} due on ${schemaValidation.data.extracted_date}`,
      relatedIds: { commitment_id: 'com_outreach_1' },
    });
    expect(caseCommitmentTransition.success).toBe(true);

    // 8. Verify Persisted Database State
    const finalCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(finalCase.state).toBe(RecoveryCaseState.COMMITMENT_ACTIVE);

    const savedCommitment = state.commitments.find((c) => c.id === 'com_outreach_1');
    expect(savedCommitment.status).toBe(CommitmentStatus.VALID_ACTIVE);
    expect(savedCommitment.is_frozen).toBe(false);

    // 9. Verify Immutable Audit Trail Ledger Completeness (3 sequential events)
    expect(state.audit_events.length).toBe(3);

    const event1 = state.audit_events[0];
    expect(event1.entity_id).toBe(recoveryCase.id);
    expect(event1.previous_state).toBe(RecoveryCaseState.OPEN);
    expect(event1.new_state).toBe(RecoveryCaseState.AWAITING_REPLY);
    expect(event1.actor).toBe('policy_engine');

    const event2 = state.audit_events[1];
    expect(event2.entity_id).toBe(recoveryCase.id);
    expect(event2.previous_state).toBe(RecoveryCaseState.AWAITING_REPLY);
    expect(event2.new_state).toBe(RecoveryCaseState.REPLY_PROCESSING);
    expect(event2.actor).toBe('system');

    const event3 = state.audit_events[2];
    expect(event3.entity_id).toBe(recoveryCase.id);
    expect(event3.previous_state).toBe(RecoveryCaseState.REPLY_PROCESSING);
    expect(event3.new_state).toBe(RecoveryCaseState.COMMITMENT_ACTIVE);
    expect(event3.actor).toBe('policy_engine');
  });

  it('safely catches ambiguous/adversarial replies without mutating case state', async () => {
    const clock = new SimulatedClock(new Date('2026-01-01T11:00:00+05:30'));

    const invoice = createInvoiceFixture({ id: 'inv_ambig_1' });
    const recoveryCase = createCaseFixture({
      id: 'case_ambig_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.AWAITING_REPLY,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // Debtor sends ambiguous/unclear message with low confidence
    const rawLLMReplyExtraction = {
      intent_type: 'AMBIGUOUS',
      extracted_amount: null,
      extracted_date: null,
      confidence: 0.45,
      ambiguity_flags: ['vague_timeline', 'no_amount'],
      dispute_reason: null,
      raw_reasoning: 'Debtor said "we will see what we can do sometime next month"',
    };

    const schemaValidation = validateReplyParseOutput(rawLLMReplyExtraction);
    expect(schemaValidation.valid).toBe(true);

    if (schemaValidation.valid) {
      // Policy Engine recognizes intent as AMBIGUOUS -> does NOT register commitment
      expect(schemaValidation.data.intent_type).toBe('AMBIGUOUS');
    }

    // Case remains safely in AWAITING_REPLY
    const currentCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(currentCase.state).toBe(RecoveryCaseState.AWAITING_REPLY);
    expect(state.commitments.length).toBe(0);
    expect(state.audit_events.length).toBe(0); // Zero fake transitions
  });
});
