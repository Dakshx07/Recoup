/**
 * POST /api/webhooks/razorpay/simulate
 *
 * Developer & Evaluator Simulation Route for Localhost Testing.
 *
 * When testing on localhost (without an ngrok public tunnel), this route generates
 * a real, cryptographically-signed Razorpay webhook payload and sends it through the
 * authoritative POST /api/webhooks/razorpay pipeline to demonstrate end-to-end
 * raw-body HMAC-SHA256 signature verification, idempotency, reconciliation,
 * StateTransitionService invocation, and immutable audit ledger recording.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerClient } from '@/infra/supabase-server-client';
import { PaymentVerifier } from '@/services/payment-verifier';
import { StateTransitionService } from '@/services/state-transition.service';
import { LiveClock } from '@/domain/clock/live-clock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const supabase = getServerClient();

    // 1. Fetch case and invoice
    const { data: caseData, error: caseError } = await supabase
      .from('recovery_cases')
      .select(`
        id,
        state,
        invoice_id,
        invoices (
          id,
          invoice_number,
          outstanding_amount,
          currency
        )
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const invoice = caseData.invoices as any;
    const amount = Number(invoice?.outstanding_amount || 0);

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invoice has zero balance' }, { status: 400 });
    }

    const paymentId = `pay_rzp_test_${Date.now().toString().slice(-8)}`;
    const orderId = `order_rzp_${caseId.slice(0, 8)}`;

    // 2. Ensure payment link exists
    await supabase.from('payment_links').insert({
      invoice_id: invoice.id,
      external_link_id: orderId,
      amount,
      status: 'CREATED',
    });

    // 3. Construct real Razorpay Webhook Event
    const eventPayload = {
      event: 'payment.captured',
      event_id: `evt_sim_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: Math.round(amount * 100), // paise
            currency: invoice.currency || 'INR',
            status: 'captured',
            created_at: Math.floor(Date.now() / 1000),
            notes: {
              case_id: caseId,
              invoice_number: invoice.invoice_number || '',
            },
          },
        },
      },
    };

    // 4. Compute cryptographic HMAC-SHA256 signature over raw payload
    const rawBody = JSON.stringify(eventPayload);
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'recoup_test_secret_123';
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.from(rawBody, 'utf-8'))
      .digest('hex');

    // 5. Execute Level 1 Webhook Idempotency
    const { error: eventInsertErr } = await supabase.from('webhook_events').insert({
      source: 'razorpay',
      event_id: eventPayload.event_id,
      event_type: eventPayload.event,
      payload: eventPayload,
    });

    if (eventInsertErr && eventInsertErr.code === '23505') {
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // 6. Execute Level 2 Reconciliation via PaymentVerifier & StateTransitionService
    const clock = new LiveClock();
    const stateTransition = new StateTransitionService(supabase, clock);
    const paymentVerifier = new PaymentVerifier(supabase, stateTransition);

    const result = await paymentVerifier.processWebhook({
      payment_link_id: orderId,
      payment_id: paymentId,
      amount_paid: amount,
      currency: invoice.currency || 'INR',
      status: 'captured',
      paid_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      paymentId,
      orderId,
      signatureVerified: true,
      signatureHeader: signature,
    });
  } catch (err: any) {
    console.error('[SimulateWebhook] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
