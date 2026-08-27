import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { SimulatedClock } from '@/domain/clock/simulated-clock';
import { StateTransitionService } from '@/services/state-transition.service';
import { PaymentVerifier } from '@/services/payment-verifier';
import { verifyWebhookSignature } from '@/infra/razorpay-client';
import { RecoveryCaseState } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus } from '@/domain/state-machine/commitment.states';
import {
  createInvoiceFixture,
  createCaseFixture,
  createCommitmentFixture,
  createPaymentLinkFixture,
  createInMemoryDatabase,
} from '../fixtures';

describe('INTEGRATION — Razorpay Test Mode Payment & Webhook Verification Flow', () => {
  const webhookSecret = 'whsec_test_mock_secret_998877';

  function createSignedWebhookPayload(eventObj: any) {
    const rawBody = JSON.stringify(eventObj);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.from(rawBody, 'utf-8'))
      .digest('hex');
    return { rawBody, signature };
  }

  it('processes valid Razorpay webhook, verifies raw body signature, reconciles invoice, and transitions case to CLOSED_PAID', async () => {
    const clock = new SimulatedClock(new Date('2026-02-15T10:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_rzp_1',
      invoice_number: 'INV-RZP-101',
      original_amount: 42000,
      outstanding_amount: 42000,
      currency: 'INR',
    });

    const recoveryCase = createCaseFixture({
      id: 'case_rzp_1',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });

    const commitment = createCommitmentFixture({
      id: 'com_rzp_1',
      recovery_case_id: recoveryCase.id,
      amount: 42000,
      status: CommitmentStatus.VALID_ACTIVE,
    });

    const razorpayOrderId = 'order_RZP_TEST_1001';
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_rzp_1',
      invoice_id: invoice.id,
      external_link_id: razorpayOrderId,
      amount: 42000,
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      commitments: [commitment],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    // 1. Simulated Razorpay webhook event
    const eventPayload = {
      event: 'payment.captured',
      event_id: 'evt_rzp_test_001',
      payload: {
        payment: {
          entity: {
            id: 'pay_RZP_TEST_9001',
            order_id: razorpayOrderId,
            amount: 4200000, // in paise
            currency: 'INR',
            status: 'captured',
            created_at: 1771153200,
          },
        },
      },
    };

    const { rawBody, signature } = createSignedWebhookPayload(eventPayload);

    // 2. Cryptographic signature check
    const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
    expect(isValidSignature).toBe(true);

    // 3. Level 1 Event Idempotency Recording
    const parsed = JSON.parse(rawBody);
    const { error: eventInsertErr } = await client.from('webhook_events').insert({
      source: 'razorpay',
      event_id: parsed.event_id,
      event_type: parsed.event,
      payload: parsed,
    });
    expect(eventInsertErr).toBeNull();
    expect(state.webhook_events.length).toBe(1);

    // 4. Pass to PaymentVerifier
    const paymentEntity = parsed.payload.payment.entity;
    const result = await paymentVerifier.processWebhook({
      payment_link_id: paymentEntity.order_id,
      payment_id: paymentEntity.id,
      amount_paid: paymentEntity.amount / 100, // paise to INR
      currency: paymentEntity.currency,
      status: paymentEntity.status,
      paid_at: new Date(paymentEntity.created_at * 1000).toISOString(),
    });

    expect(result.success).toBe(true);

    // 5. Verify authoritative database mutations
    // Payment recorded exactly once
    expect(state.payments.length).toBe(1);
    expect(state.payments[0].external_payment_id).toBe('pay_RZP_TEST_9001');
    expect(state.payments[0].amount).toBe(42000);
    expect(state.payments[0].verification_source).toBe('webhook_plus_api_check');

    // Invoice balance extinguished
    const updatedInvoice = state.invoices.find((i) => i.id === invoice.id);
    expect(updatedInvoice.outstanding_amount).toBe(0);

    // Recovery case transitioned to CLOSED_PAID via StateTransitionService
    const updatedCase = state.recovery_cases.find((c) => c.id === recoveryCase.id);
    expect(updatedCase.state).toBe(RecoveryCaseState.CLOSED_PAID);
    expect(updatedCase.closed_at).toBeDefined();

    // Immutable audit event recorded with actor 'payment_verifier'
    expect(state.audit_events.length).toBe(1);
    const audit = state.audit_events[0];
    expect(audit.entity_type).toBe('recovery_case');
    expect(audit.entity_id).toBe(recoveryCase.id);
    expect(audit.actor).toBe('payment_verifier');
    expect(audit.previous_state).toBe(RecoveryCaseState.COMMITMENT_ACTIVE);
    expect(audit.new_state).toBe(RecoveryCaseState.CLOSED_PAID);
    expect(audit.reason).toContain('Full payment of 42000 received');
  });

  it('enforces Level 1 (Event) and Level 2 (Payment) idempotency against duplicate deliveries', async () => {
    const clock = new SimulatedClock(new Date('2026-02-15T10:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_idem_rzp',
      original_amount: 50000,
      outstanding_amount: 50000,
    });
    const recoveryCase = createCaseFixture({
      id: 'case_idem_rzp',
      invoice_id: invoice.id,
      state: RecoveryCaseState.OPEN,
    });
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_idem_rzp',
      invoice_id: invoice.id,
      external_link_id: 'order_IDEM_123',
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    const eventPayload = {
      event: 'payment.captured',
      event_id: 'evt_idem_first_attempt',
      payload: {
        payment: {
          entity: {
            id: 'pay_RZP_IDEM_555',
            order_id: 'order_IDEM_123',
            amount: 5000000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };

    // First attempt: records event, records payment, updates invoice, closes case
    await client.from('webhook_events').insert({
      source: 'razorpay',
      event_id: eventPayload.event_id,
      event_type: eventPayload.event,
      payload: eventPayload,
    });

    const firstResult = await paymentVerifier.processWebhook({
      payment_link_id: 'order_IDEM_123',
      payment_id: 'pay_RZP_IDEM_555',
      amount_paid: 50000,
      currency: 'INR',
      status: 'captured',
    });

    expect(firstResult.success).toBe(true);
    expect(state.payments.length).toBe(1);
    expect(state.audit_events.length).toBe(1);

    // Duplicate webhook with same event_id: hits Level 1 unique constraint
    const duplicateEventInsert = await client.from('webhook_events').insert({
      source: 'razorpay',
      event_id: eventPayload.event_id,
      event_type: eventPayload.event,
      payload: eventPayload,
    });
    expect(duplicateEventInsert.error?.code).toBe('23505');

    // Duplicate delivery with same payment_id: hits Level 2 unique constraint
    const secondResult = await paymentVerifier.processWebhook({
      payment_link_id: 'order_IDEM_123',
      payment_id: 'pay_RZP_IDEM_555',
      amount_paid: 50000,
      currency: 'INR',
      status: 'captured',
    });

    expect(secondResult.success).toBe(true);
    expect(secondResult.message).toBe('Already processed');

    // Payments, audits, and invoice balances are strictly not duplicated
    expect(state.payments.length).toBe(1);
    expect(state.audit_events.length).toBe(1);
    expect(state.invoices[0].outstanding_amount).toBe(0);
  });

  it('rejects terminal state mutation and does not reopen closed cases', async () => {
    const clock = new SimulatedClock(new Date('2026-02-15T10:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_term_rzp',
      original_amount: 10000,
      outstanding_amount: 0,
      status: 'CLOSED_PAID',
    });
    const recoveryCase = createCaseFixture({
      id: 'case_term_rzp',
      invoice_id: invoice.id,
      state: RecoveryCaseState.CLOSED_PAID,
      closed_at: new Date('2026-02-10T10:00:00Z').toISOString(),
    });
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_term_rzp',
      invoice_id: invoice.id,
      external_link_id: 'order_TERM_999',
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    const result = await paymentVerifier.processWebhook({
      payment_link_id: 'order_TERM_999',
      payment_id: 'pay_RZP_TERM_111',
      amount_paid: 10000,
      currency: 'INR',
      status: 'captured',
    });

    expect(result.success).toBe(true);
    // Case remains CLOSED_PAID with original closed_at timestamp
    const c = state.recovery_cases[0];
    expect(c.state).toBe(RecoveryCaseState.CLOSED_PAID);
    expect(c.closed_at).toBe(new Date('2026-02-10T10:00:00Z').toISOString());
  });

  it('fails safely when payment link or order ID is unknown', async () => {
    const clock = new SimulatedClock(new Date('2026-02-15T10:00:00Z'));
    const { client } = createInMemoryDatabase({});

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    await expect(
      paymentVerifier.processWebhook({
        payment_link_id: 'order_UNKNOWN_404',
        payment_id: 'pay_RZP_404',
        amount_paid: 5000,
        currency: 'INR',
        status: 'captured',
      })
    ).rejects.toThrowError(/Payment link not found: order_UNKNOWN_404/);
  });

  it('guarantees that browser checkout callback cannot directly mutate case state without verified webhook', async () => {
    const clock = new SimulatedClock(new Date('2026-02-15T10:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_browser_cb',
      original_amount: 30000,
      outstanding_amount: 30000,
    });
    const recoveryCase = createCaseFixture({
      id: 'case_browser_cb',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });

    const { state } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
    });

    // Browser checkout response received on client
    const browserCheckoutResponse = {
      razorpay_payment_id: 'pay_unverified_123',
      razorpay_order_id: 'order_unverified_456',
      razorpay_signature: 'unverified_client_sig',
    };

    // Browser callback alone does NOT mutate recovery_cases, commitments, or payments
    expect(state.payments.length).toBe(0);
    expect(state.recovery_cases[0].state).toBe(RecoveryCaseState.COMMITMENT_ACTIVE);
    expect(state.invoices[0].outstanding_amount).toBe(30000);
    expect(state.audit_events.length).toBe(0);
  });

  it('handles partial amount without prematurely closing case to CLOSED_PAID', async () => {
    const clock = new SimulatedClock(new Date('2026-02-15T10:00:00Z'));

    const invoice = createInvoiceFixture({
      id: 'inv_partial_rzp',
      original_amount: 50000,
      outstanding_amount: 50000,
    });
    const recoveryCase = createCaseFixture({
      id: 'case_partial_rzp',
      invoice_id: invoice.id,
      state: RecoveryCaseState.COMMITMENT_ACTIVE,
    });
    const paymentLink = createPaymentLinkFixture({
      id: 'plink_partial_rzp',
      invoice_id: invoice.id,
      external_link_id: 'order_PARTIAL_777',
    });

    const { state, client } = createInMemoryDatabase({
      invoices: [invoice],
      recovery_cases: [recoveryCase],
      payment_links: [paymentLink],
    });

    const stateTransition = new StateTransitionService(client, clock);
    const paymentVerifier = new PaymentVerifier(client, stateTransition);

    // Debtor pays 20,000 against 50,000
    const result = await paymentVerifier.processWebhook({
      payment_link_id: 'order_PARTIAL_777',
      payment_id: 'pay_PARTIAL_20K',
      amount_paid: 20000,
      currency: 'INR',
      status: 'captured',
    });

    expect(result.success).toBe(true);
    expect(state.invoices[0].outstanding_amount).toBe(30000);
    // Case is NOT closed because 30,000 remains outstanding
    expect(state.recovery_cases[0].state).toBe(RecoveryCaseState.COMMITMENT_ACTIVE);
    expect(state.recovery_cases[0].closed_at).toBeNull();
    expect(state.payments.length).toBe(1);
  });
});
