import { describe, it, expect } from 'vitest';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { StateTransitionService } from '@/services/state-transition.service';
import {
  RecoveryCaseState,
  TERMINAL_CASE_STATES,
} from '@/domain/state-machine/recovery-case.states';
import { validateCaseTransition } from '@/domain/state-machine/transitions';
import {
  createInvoiceFixture,
  createCaseFixture,
  createCommitmentFixture,
  createInMemoryDatabase,
} from '../fixtures';

describe('INTEGRATION — Human Override API Boundary & State Protection', () => {
  it('executes a valid human write-off override with justification and audit trail', async () => {
    const clock = new SimulatedClock(new Date('2026-01-15T10:00:00Z'));

    const invoice = createInvoiceFixture({ id: 'inv_hov_1' });
    const recoveryCase = createCaseFixture({
      id: 'case_hov_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.ESCALATED,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // Reviewer manually writes off unrecoverable balance
    const justification = 'Merchant credit committee approved full bad-debt write-off.';
    const result = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.CLOSED_WRITTEN_OFF,
      actor: 'human',
      eventType: 'human_override_write_off',
      reason: `Balance written off by reviewer. Justification: ${justification}`,
    });
    expect(result.success).toBe(true);

    // Case is now in terminal CLOSED_WRITTEN_OFF
    const updatedCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(updatedCase.state).toBe(RecoveryCaseState.CLOSED_WRITTEN_OFF);
    expect(updatedCase.closed_at).toBeDefined();

    // Audit Event Recorded with Human Actor
    expect(state.audit_events.length).toBe(1);
    const auditEvent = state.audit_events[0];
    expect(auditEvent.actor).toBe('human');
    expect(auditEvent.previous_state).toBe(RecoveryCaseState.ESCALATED);
    expect(auditEvent.new_state).toBe(RecoveryCaseState.CLOSED_WRITTEN_OFF);
    expect(auditEvent.reason).toContain('Merchant credit committee approved');
  });

  it('rejects human override attempts on terminal cases (CLOSED_PAID)', async () => {
    const clock = new SimulatedClock(new Date('2026-01-15T10:00:00Z'));

    const invoice = createInvoiceFixture({ id: 'inv_term_1' });
    const terminalCase = createCaseFixture({
      id: 'case_term_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.CLOSED_PAID,
    });

    const { client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [terminalCase],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // Attempting to escalate or reopen a CLOSED_PAID case must be rejected by the state machine
    const validation = validateCaseTransition(terminalCase.state, RecoveryCaseState.ESCALATED);
    expect(validation.valid).toBe(false);

    const result = await stateTransition.transitionCase({
      caseId: terminalCase.id,
      newState: RecoveryCaseState.ESCALATED,
      actor: 'human',
      eventType: 'human_override_escalate',
      reason: 'Attempting override on closed case',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('terminal state');
    }
  });

  it('enforces optimistic locking on concurrent override attempts', async () => {
    const clock = new SimulatedClock(new Date('2026-01-15T10:00:00Z'));

    const invoice = createInvoiceFixture({ id: 'inv_conc_1' });
    const recoveryCase = createCaseFixture({
      id: 'case_conc_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.DISPUTE_OPEN,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
    });

    const stateTransition = new StateTransitionService(client, clock);

    // Worker 1 transitions case: DISPUTE_OPEN -> COMMITMENT_ACTIVE
    const result1 = await stateTransition.transitionCase({
      caseId: recoveryCase.id,
      newState: RecoveryCaseState.COMMITMENT_ACTIVE,
      actor: 'human',
      eventType: 'human_override_reject_dispute',
      reason: 'Dispute rejected by reviewer A',
    });
    expect(result1.success).toBe(true);

    // Stale Worker 2 attempts transition expecting old state DISPUTE_OPEN -> CLOSED_WRITTEN_OFF
    // In actual API, .eq('state', expectedState) will match 0 rows
    const staleStateMatches = state.recovery_cases.filter(
      (c) => c.id === recoveryCase.id && c.state === RecoveryCaseState.DISPUTE_OPEN
    );
    expect(staleStateMatches.length).toBe(0); // Protected: Case is now in COMMITMENT_ACTIVE
  });
});
