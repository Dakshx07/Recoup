/**
 * POST /api/webhooks/razorpay
 *
 * Authoritative Server-to-Server Webhook Handler for Razorpay Test Mode Payments.
 *
 * Security & Invariants:
 * 1. Raw body HMAC-SHA256 signature verification BEFORE JSON parsing
 * 2. Webhook Event Idempotency (Level 1) via webhook_events unique constraint (source, event_id)
 * 3. Payment Idempotency (Level 2) via payments.external_payment_id unique constraint
 * 4. Reconciliation against authoritative payment_links and invoices
 * 5. Deterministic state transition via StateTransitionService -> CLOSED_PAID
 * 6. Immutable audit event recording with exact actor ('payment_verifier') and causal justification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';
import { verifyWebhookSignature } from '@/infra/razorpay-client';
import { PaymentVerifier } from '@/services/payment-verifier';
import { StateTransitionService } from '@/services/state-transition.service';
import { LiveClock } from '@/domain/clock/live-clock';

export async function POST(request: NextRequest) {
  try {
    // 1. Read EXACT raw request body for cryptographic signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const eventIdHeader = request.headers.get('x-razorpay-event-id');

    if (!signature) {
      console.warn('[RazorpayWebhook] Missing x-razorpay-signature header');
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // 2. Verify raw-body HMAC-SHA256 signature with timingSafeEqual
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.error('[RazorpayWebhook] Invalid webhook signature detected.');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // 3. Parse JSON only AFTER signature has been verified
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error('[RazorpayWebhook] Malformed JSON payload:', parseErr);
      return NextResponse.json(
        { error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    const eventType = event.event;
    const eventId =
      eventIdHeader ||
      event.event_id ||
      event.id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`[RazorpayWebhook] Processing verified event: ${eventType} (ID: ${eventId})`);

    const supabase = getServerClient();

    // 4. LEVEL 1 IDEMPOTENCY: Webhook Event Deduplication
    const { error: eventInsertError } = await supabase
      .from('webhook_events')
      .insert({
        source: 'razorpay',
        event_id: eventId,
        event_type: eventType,
        payload: event,
      });

    if (eventInsertError) {
      if (eventInsertError.code === '23505') {
        // Unique violation on (source, event_id) -> already processed
        console.log(`[RazorpayWebhook] Duplicate webhook event ${eventId}. Idempotent return.`);
        return NextResponse.json({
          success: true,
          message: 'Webhook event already processed (idempotent)',
        });
      }
      console.error('[RazorpayWebhook] Failed to insert webhook event record:', eventInsertError);
    }

    // 5. Handle supported event types
    if (eventType === 'payment.failed') {
      console.log(`[RazorpayWebhook] Payment failed notification received for payment: ${event.payload?.payment?.entity?.id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment failure recorded (no case state change)',
      });
    }

    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      console.log(`[RazorpayWebhook] Ignored unhandled event type: ${eventType}`);
      return NextResponse.json({
        success: true,
        message: `Ignored event type ${eventType}`,
      });
    }

    // 6. Extract payment and order identifiers
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const paymentId = paymentEntity?.id;
    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const amountInPaise = paymentEntity?.amount || orderEntity?.amount_paid || orderEntity?.amount;
    const currency = paymentEntity?.currency || orderEntity?.currency || 'INR';

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: 'Payload missing payment ID and order ID' },
        { status: 400 }
      );
    }

    // Convert paise to standard currency amount
    const amountPaid = Number(amountInPaise) / 100;
    const effectivePaymentId = paymentId || `pay_order_${orderId}`;
    const effectiveLinkId = orderId || paymentId;

    // 7. LEVEL 2 IDEMPOTENCY & RECONCILIATION via PaymentVerifier
    const clock = new LiveClock();
    const stateTransition = new StateTransitionService(supabase, clock);
    const paymentVerifier = new PaymentVerifier(supabase, stateTransition);

    const paidAtTimestamp = paymentEntity?.created_at
      ? new Date(paymentEntity.created_at * 1000).toISOString()
      : new Date().toISOString();

    const result = await paymentVerifier.processWebhook({
      payment_link_id: effectiveLinkId,
      payment_id: effectivePaymentId,
      amount_paid: amountPaid,
      currency,
      status: 'captured',
      paid_at: paidAtTimestamp,
      notes: paymentEntity?.notes || orderEntity?.notes,
    });

    console.log(`[RazorpayWebhook] Reconciliation completed for ${effectivePaymentId}:`, result);

    return NextResponse.json({
      success: true,
      message: result.message,
      paymentId: effectivePaymentId,
      orderId: effectiveLinkId,
    });
  } catch (err: any) {
    console.error('[RazorpayWebhook] Unhandled webhook processing error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
