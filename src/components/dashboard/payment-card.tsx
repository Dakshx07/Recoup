import { CheckCircle2, Receipt } from 'lucide-react';
import { formatSimulatedTime, formatSimulatedTimeAgo } from '@/lib/simulated-time';

export interface PaymentData {
  id: string;
  amount: number;
  paidAt: string;
  verificationSource: string;
  externalId: string;
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

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-green-800">
          Payment Verified
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Amount received</p>
          <p className="text-xl font-semibold text-neutral-900 tabular-nums">
            {formatCurrency(payment.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-1">Paid on</p>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-neutral-900">
              <Receipt className="w-4 h-4 text-neutral-400" />
              <span className="font-medium">
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
      
      <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs text-neutral-500">
        <span>
          Source: {payment.verificationSource}
        </span>
        <span className="text-[10px] font-mono text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
          {payment.externalId}
        </span>
      </div>
    </div>
  );
}
