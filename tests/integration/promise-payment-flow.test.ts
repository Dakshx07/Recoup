import { describe, it, expect } from 'vitest';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { StateTransitionService } from '@/services/state-transition.service';
import { PaymentVerifier } from '@/services/payment-verifier';
import { RecoveryCaseState } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus } from '@/domain/state-machine/commitment.states';
import {
  createInvoiceFixture,
  createCaseFixture,
  createCommitmentFixture,
  createPaymentLinkFixture,
  createInMemoryDatabase,
} from '../fixtures';

describe('INTEGRATION — Promise ➔ Payment ➔ Reconciliation ➔ Settlement Flow', () => {
  it('processes full payment webhook, reconciles invoice balance, and closes case (CLOSED_PAID)', async () => {
    const clock = new SimulatedClock(new Date('2026-01-10T12:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_pay_1',
      original_amount: 50000,
      outstanding_amount: 50000,
    });
    const recoveryCase = createCaseFixture({
      id: 'case_pay_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });
    const commitment = createCommitmentFixture({
      id: 'com_pay_1',
      recovery_case_id: recoveryCase.id,
      amount: 50000,
      status: CommitmentStatus.VALID_ACTIVE,
    });
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_pay_1',
      invoice_id: invoice.id,
      external_link_id: 'plink_ext_pay_1',
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      commitments: [commitment],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    // Incoming Captured Webhook
    const webhookPayload = {
      payment_link_id: 'plink_ext_pay_1',
      payment_id: 'pay_rzp_9901',
      amount_paid: 50000,
      currency: 'INR',
      status: 'captured',
    };

    const result = await paymentVerifier.processWebhook(webhookPayload);
    expect(result.success).toBe(true);

    // 1. Verify Payment Recorded
    expect(state.payments.length).toBe(1);
    const paymentRecord = state.payments[0];
    expect(paymentRecord.external_payment_id).toBe('pay_rzp_9901');
    expect(paymentRecord.amount).toBe(50000);

    // 2. Verify Invoice Balance Extinguished
    const updatedInvoice = state.invoices.find((i) => i.id === invoice.id);
    expect(updatedInvoice.outstanding_amount).toBe(0);

    // 3. Verify Case State Closed as CLOSED_PAID
    const updatedCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(updatedCase.state).toBe(RecoveryCaseState.CLOSED_PAID);
    expect(updatedCase.closed_at).toBeDefined();

    // 4. Verify Audit Trail Appended
    expect(state.audit_events.length).toBe(1);
    const auditEvent = state.audit_events[0];
    expect(auditEvent.entity_id).toBe(recoveryCase.id);
    expect(auditEvent.previous_state).toBe(RecoveryCaseState.COMMITMENT_ACTIVE);
    expect(auditEvent.new_state).toBe(RecoveryCaseState.CLOSED_PAID);
    expect(auditEvent.actor).toBe('payment_verifier');
  });

  it('guarantees idempotency on duplicate payment webhooks without double crediting', async () => {
    const clock = new SimulatedClock(new Date('2026-01-10T12:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_idem_1',
      original_amount: 50000,
      outstanding_amount: 50000,
    });
    const recoveryCase = createCaseFixture({
      id: 'case_idem_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_idem_1',
      invoice_id: invoice.id,
      external_link_id: 'plink_ext_idem_1',
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    const webhookPayload = {
      payment_link_id: 'plink_ext_idem_1',
      payment_id: 'pay_rzp_dup_001',
      amount_paid: 50000,
      currency: 'INR',
      status: 'captured',
    };

    // First attempt -> succeeds and closes case
    const firstAttempt = await paymentVerifier.processWebhook(webhookPayload);
    expect(firstAttempt.success).toBe(true);
    expect(state.payments.length).toBe(1);
    expect(state.audit_events.length).toBe(1);

    // Second duplicate attempt (same external_payment_id) -> catches unique constraint and returns gracefully
    const secondAttempt = await paymentVerifier.processWebhook(webhookPayload);
    expect(secondAttempt.success).toBe(true);
    expect(secondAttempt.message).toBe('Already processed');

    // Payments and audit events must NOT be duplicated
    expect(state.payments.length).toBe(1);
    expect(state.audit_events.length).toBe(1);
    expect(state.invoices[0].outstanding_amount).toBe(0);
  });

  it('handles partial payment within tolerance threshold without false broken escalations', async () => {
    const clock = new SimulatedClock(new Date('2026-01-10T12:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_partial_1',
      original_amount: 50000,
      outstanding_amount: 50000,
    });
    const recoveryCase = createCaseFixture({
      id: 'case_partial_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_partial_1',
      invoice_id: invoice.id,
      external_link_id: 'plink_ext_part_1',
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    // Debtor pays ₹46,000 (92% of ₹50,000 reference debt)
    const webhookPayload = {
      payment_link_id: 'plink_ext_part_1',
      payment_id: 'pay_rzp_partial_001',
      amount_paid: 46000,
      currency: 'INR',
      status: 'captured',
    };

    const result = await paymentVerifier.processWebhook(webhookPayload);
    expect(result.success).toBe(true);

    // Remaining balance is updated
    expect(state.invoices[0].outstanding_amount).toBe(4000);
    expect(state.payments.length).toBe(1);
  });
});
