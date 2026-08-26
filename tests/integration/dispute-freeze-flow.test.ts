import { describe, it, expect } from 'vitest';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { StateTransitionService } from '@/services/state-transition.service';
import { CronService } from '@/services/cron.service';
import { evaluateDisputeAction, resolveDispute } from '@/domain/policy-engine/dispute-freeze';
import { RecoveryCaseState } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus } from '@/domain/state-machine/commitment.states';
import {
  createInvoiceFixture,
  createCaseFixture,
  createCommitmentFixture,
  createInMemoryDatabase,
} from '../fixtures';

describe('INTEGRATION — Dispute Freeze End-to-End Lifecycle & Adjudication Flow', () => {
  it('freezes commitment during dispute and prevents cron scheduler from breaking commitment when due date passes', async () => {
    const clock = new SimulatedClock(new Date('2026-01-05T10:00:00Z'));

    const invoice = createInvoiceFixture({ id: 'inv_freeze_1', outstanding_amount: 50000 });
    const recoveryCase = createCaseFixture({
      id: 'case_freeze_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });
    const commitment = createCommitmentFixture({
      id: 'com_freeze_1',
      recovery_case_id: recoveryCase.id,
      amount: 50000,
      due_date: '2026-01-10T12:00:00Z', // Due in 5 days
      status: CommitmentStatus.VALID_ACTIVE,
      is_frozen: false,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      commitments: [commitment],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const cronService = new CronService(client, stateTransition, clock);

    // 1. Debtor raises a line-item dispute on Jan 5
    const disputeAction = evaluateDisputeAction({
      hasActiveCommitment: true,
      isCommitmentFrozen: commitment.is_frozen,
      totalDisputeCount: 0,
    });
    expect(disputeAction.action).toBe('FREEZE_COMMITMENT');

    // 2. State Transition: Case -> DISPUTE_OPEN, Commitment -> is_frozen = true
    await client
      .from('commitments')
      .update({ is_frozen: true })
      .eq('id', commitment.id);

    const caseDisputeTransition = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.DISPUTE_OPEN,
      actor: 'policy_engine',
      eventType: 'dispute_detected_commitment_frozen',
      reason: 'Debtor disputed line item. Commitment frozen per Dispute-Freeze invariant.',
      relatedIds: { commitment_id: commitment.id },
    });
    expect(caseDisputeTransition.success).toBe(true);

    // Verify DB state
    const frozenCommitment = state.commitments.find((c) => c.id === commitment.id);
    expect(frozenCommitment.is_frozen).toBe(true);
    expect(frozenCommitment.status).toBe(CommitmentStatus.VALID_ACTIVE); // Preserved, not voided

    const disputedCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(disputedCase.state).toBe(RecoveryCaseState.DISPUTE_OPEN);

    // 3. Time passes! Clock advances to Jan 20 (10 days AFTER the original promised due date of Jan 10)
    clock.advance(new Date('2026-01-20T12:00:00Z'));

    // 4. Cron runs hourly sweeps
    const cronResult = await cronService.runHourlyChecks();

    // Cron MUST NOT mark the frozen commitment as broken!
    expect(cronResult.brokenPromises).toBe(0);

    const commitmentAfterCron = state.commitments.find((c) => c.id === commitment.id);
    expect(commitmentAfterCron.status).toBe(CommitmentStatus.VALID_ACTIVE);
    expect(commitmentAfterCron.is_frozen).toBe(true);

    const caseAfterCron = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(caseAfterCron.state).toBe(RecoveryCaseState.DISPUTE_OPEN); // Not escalated or broken
  });

  it('unfreezes commitment and preserves original promised date when human rejects dispute', async () => {
    const clock = new SimulatedClock(new Date('2026-01-08T10:00:00Z'));

    const invoice = createInvoiceFixture({ id: 'inv_rej_1' });
    const recoveryCase = createCaseFixture({
      id: 'case_rej_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.DISPUTE_OPEN,
    });
    const commitment = createCommitmentFixture({
      id: 'com_rej_1',
      recovery_case_id: recoveryCase.id,
      due_date: '2026-01-15T12:00:00Z',
      status: CommitmentStatus.VALID_ACTIVE,
      is_frozen: true,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      commitments: [commitment],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // Human reviewer reviews proof and rejects the dispute
    const resolution = resolveDispute({
      resolution: 'REJECTED',
      originalPromisedDate: new Date(commitment.due_date),
    });
    expect(resolution.commitmentAction).toBe('UNFREEZE');
    expect(resolution.caseAction).toBe('RESUME_COMMITMENT');

    // Unfreeze commitment in DB
    await client
      .from('commitments')
      .update({ is_frozen: false })
      .eq('id', commitment.id);

    // Transition case back to COMMITMENT_ACTIVE
    const transitionResult = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.COMMITMENT_ACTIVE,
      actor: 'human',
      eventType: 'dispute_rejected_unfrozen',
      reason: resolution.reason,
    });
    expect(transitionResult.success).toBe(true);

    const unfrozenCommitment = state.commitments.find((c) => c.id === commitment.id);
    expect(unfrozenCommitment.is_frozen).toBe(false);
    expect(unfrozenCommitment.status).toBe(CommitmentStatus.VALID_ACTIVE);
    expect(unfrozenCommitment.due_date).toBe('2026-01-15T12:00:00Z'); // Original date preserved
  });

  it('voids commitment and reopens case when human upholds dispute', async () => {
    const clock = new SimulatedClock(new Date('2026-01-08T10:00:00Z'));

    const invoice = createInvoiceFixture({ id: 'inv_uphold_1' });
    const recoveryCase = createCaseFixture({
      id: 'case_uphold_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.DISPUTE_OPEN,
    });
    const commitment = createCommitmentFixture({
      id: 'com_uphold_1',
      recovery_case_id: recoveryCase.id,
      status: CommitmentStatus.VALID_ACTIVE,
      is_frozen: true,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      commitments: [commitment],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // Human reviewer validates line-item error and upholds dispute
    const resolution = resolveDispute({
      resolution: 'UPHELD',
      originalPromisedDate: new Date(commitment.due_date),
    });
    expect(resolution.commitmentAction).toBe('VOID');
    expect(resolution.caseAction).toBe('REOPEN');

    // Void commitment in DB
    await client
      .from('commitments')
      .update({
        status: CommitmentStatus.VOIDED_BY_DISPUTE,
        is_frozen: false,
        resolved_at: clock.now().toISOString(),
      })
      .eq('id', commitment.id);

    // Transition case to OPEN for revised billing negotiation
    const transitionResult = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.OPEN,
      actor: 'human',
      eventType: 'dispute_upheld_reopened',
      reason: resolution.reason,
    });
    expect(transitionResult.success).toBe(true);

    const voidedCommitment = state.commitments.find((c) => c.id === commitment.id);
    expect(voidedCommitment.status).toBe(CommitmentStatus.VOIDED_BY_DISPUTE);
    expect(voidedCommitment.is_frozen).toBe(false);

    const reopenedCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(reopenedCase.state).toBe(RecoveryCaseState.OPEN);
  });
});
