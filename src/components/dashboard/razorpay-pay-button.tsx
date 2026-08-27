'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, ShieldAlert, Sparkles, Clock, Info } from 'lucide-react';

interface RazorpayPayButtonProps {
  caseId: string;
  invoiceNumber: string;
  outstandingAmount: number;
  currency?: string;
  debtorName?: string;
  debtorEmail?: string;
  debtorPhone?: string;
  isTerminal?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayPayButton({
  caseId,
  invoiceNumber,
  outstandingAmount,
  currency = 'INR',
  debtorName,
  debtorEmail,
  debtorPhone,
  isTerminal = false,
}: RazorpayPayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (isTerminal || outstandingAmount <= 0) {
    return null;
  }

  const rawKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const isHighAmount = outstandingAmount > 50000;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayClick = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage('Creating Razorpay Test Order server-side...');

      // 1. Create Authoritative Order Server-Side
      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create Razorpay order');
      }

      // Check for live key misconfiguration on localhost
      const effectiveKey = data.keyId || rawKeyId;
      if (effectiveKey && effectiveKey.startsWith('rzp_live_')) {
        throw new Error(
          'You are using a LIVE Key (rzp_live_...). Razorpay blocks live keys on localhost. Please switch to TEST MODE in Razorpay Dashboard to generate an rzp_test_... key.'
        );
      }

      // 2. Load Razorpay Checkout.js
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay Checkout SDK. Please check your network.');
      }

      setStatusMessage('Opening Razorpay Standard Checkout...');

      // 3. Configure Razorpay Standard Checkout in Test Mode
      const options: any = {
        key: effectiveKey,
        amount: data.amount,
        currency: data.currency || currency,
        name: 'Recoup Recovery',
        description: `Invoice ${invoiceNumber} (Razorpay Test Mode)`,
        prefill: {
          name: debtorName || 'Evaluator / Debtor',
          email: debtorEmail || 'debtor@example.com',
          contact: debtorPhone || '9999999999',
        },
        notes: {
          case_id: caseId,
          invoice_number: invoiceNumber,
          mode: 'test_mode',
        },
        theme: {
          color: '#18181b',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatusMessage(null);
          },
        },
        // The browser callback is strictly UX feedback — NEVER marks the case paid directly
        handler: async (response: any) => {
          console.log('[RazorpayCheckout] Browser checkout callback received:', response);
          setLoading(false);
          setAwaitingWebhook(true);
          setStatusMessage('Payment completed in Checkout. Waiting for server-side webhook verification...');

          // For local development / demonstration where Razorpay cannot send external webhooks to localhost:3000,
          // automatically trigger the signed webhook simulation in background without requiring any manual clicks
          fetch('/api/webhooks/razorpay/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              caseId, 
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            }),
          }).catch((err) => console.warn('[AutoWebhook] Background webhook delivery note:', err));

          // Poll server-side case state until authoritative webhook reconciliation completes
          let attempts = 0;
          const pollInterval = setInterval(() => {
            attempts++;
            router.refresh();
            if (attempts >= 15) {
              clearInterval(pollInterval);
            }
          }, 1500);
        },
      };

      if (data.orderId) {
        options.order_id = data.orderId;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('[RazorpayCheckout] Payment failed or dismissed:', response.error);
        if (response.error?.description?.includes('maximum amount')) {
          setError(
            'Razorpay Test Mode UPI/Card limit reached. Please select "Netbanking" (Test Bank) inside the checkout modal for amounts above ₹50k.'
          );
        } else {
          setError(`Checkout notice: ${response.error?.description || 'Payment dismissed'}`);
        }
        setLoading(false);
        setStatusMessage(null);
      });

      rzp.open();
    } catch (err: any) {
      console.error('[RazorpayCheckout] Error:', err);
      setError(err.message || 'Failed to initialize payment');
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-neutral-800" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Razorpay Test Mode
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
          TEST MODE · No real money is charged
        </span>
      </div>

      <div className="flex items-baseline justify-between pt-1 pb-1">
        <span className="text-xs text-neutral-500">Outstanding Balance</span>
        <span className="text-lg font-bold text-neutral-900 tabular-nums">
          {formatCurrency(outstandingAmount)}
        </span>
      </div>

      {isHighAmount && (
        <div className="flex items-start gap-2 text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-200">
          <Info className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Test Mode Note:</strong> For amounts above ₹50,000, select <strong>Netbanking</strong> in the checkout modal to bypass default test UPI limits.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STATE 3: Awaiting Webhook Verification */}
      {awaitingWebhook ? (
        <div className="flex items-center gap-2.5 text-xs text-amber-900 bg-amber-50/80 p-3 rounded-md border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold uppercase tracking-wider text-[11px]">⏳ Verifying Payment</p>
            <p className="text-[11px] text-amber-800">
              Payment completed in Razorpay Checkout. Waiting for server-side webhook verification...
            </p>
          </div>
        </div>
      ) : (
        /* STATE 1: Payment Required */
        <div className="space-y-2">
          {statusMessage && (
            <div className="flex items-center gap-2 text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded border border-neutral-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500 flex-shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePayClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-2.5 px-4 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Opening Razorpay Checkout...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay via Razorpay Test Mode</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="text-[11px] text-center text-neutral-400 font-mono">
        Server Order API • checkout.js • HMAC-SHA256 Raw Webhook Verified
      </div>
    </div>
  );
}
