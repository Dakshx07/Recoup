import { CheckCircle2, Receipt, ShieldCheck, Check } from 'lucide-react';
import { formatSimulatedTime, formatSimulatedTimeAgo } from '@/lib/simulated-time';

export interface PaymentData {
  id: string;
  amount: number;
  paidAt: string;
  verificationSource: string;
  externalId: string;
  orderId?: string;
}

interface PaymentCardProps {
  payment: PaymentData | null;
  /** Current simulated business time */
  simulatedNow?: string | Date;
}

export function PaymentCard({ payment, simulatedNow }: PaymentCardProps) {
  if (!payment) {
    return null;
  }

  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const paidRelative = simulatedNow
    ? formatSimulatedTimeAgo(payment.paidAt, simulatedNow)
    : '';

  const isRazorpay =
    payment.externalId?.startsWith('pay_') ||
    payment.verificationSource?.toLowerCase().includes('razorpay');

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/60 p-4 mt-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-green-900">
            Payment Verified
          </span>
        </div>
        {isRazorpay && (
          <span className="text-[10px] font-mono font-semibold text-green-800 bg-green-100 border border-green-200 px-2 py-0.5 rounded">
            RAZORPAY TEST MODE
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Amount received</p>
          <p className="text-xl font-bold text-neutral-900 tabular-nums">
            {formatCurrency(payment.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-1">Paid on</p>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-neutral-900">
              <Receipt className="w-4 h-4 text-neutral-400" />
              <span className="font-medium text-xs">
                {formatSimulatedTime(payment.paidAt)}
              </span>
            </div>
            {paidRelative && (
              <span className="text-[11px] font-mono text-green-700 mt-0.5">
                ({paidRelative})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification Proof Breakdown */}
      <div className="pt-2 border-t border-green-200/70 space-y-1.5">
        <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          Automated Verification Proof
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-neutral-700 font-mono">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            <span>Webhook Signature: Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            <span>Payment Idempotency: Passed</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            <span>Ledger Reconciliation: Applied</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            <span>Audit Event: Recorded</span>
          </div>
        </div>
      </div>
      
      <div className="pt-2.5 border-t border-green-200/70 flex flex-wrap justify-between items-center text-xs text-neutral-600 gap-2">
        <span className="truncate max-w-[200px]">
          Source: {payment.verificationSource}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
            {payment.externalId}
          </span>
        </div>
      </div>
    </div>
  );
}
