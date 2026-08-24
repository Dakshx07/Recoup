import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export interface CommitmentData {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  isFrozen: boolean;
  createdAt: string;
}

interface CommitmentCardProps {
  commitment: CommitmentData | null;
}

export function CommitmentCard({ commitment }: CommitmentCardProps) {
  if (!commitment) {
    return (
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 border-dashed p-6 text-center">
        <p className="text-sm text-neutral-500 font-medium">No active commitment</p>
        <p className="text-xs text-neutral-400 mt-1">Awaiting debtor reply or negotiation.</p>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const getStatusConfig = () => {
    if (commitment.isFrozen) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: AlertCircle,
        iconColor: 'text-amber-500',
        textColor: 'text-amber-800',
        label: 'Frozen — under dispute review',
      };
    }
    switch (commitment.status) {
      case 'VALID_ACTIVE':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: Clock,
          iconColor: 'text-green-500',
          textColor: 'text-green-800',
          label: 'Active promise',
        };
      case 'KEPT':
      case 'PARTIALLY_KEPT':
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          icon: CheckCircle2,
          iconColor: 'text-neutral-400',
          textColor: 'text-neutral-600',
          label: commitment.status === 'KEPT' ? 'Promise kept' : 'Partially kept',
        };
      case 'BROKEN':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-500',
          textColor: 'text-red-800',
          label: 'Promise broken',
        };
      case 'VOIDED_BY_DISPUTE':
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          icon: AlertCircle,
          iconColor: 'text-neutral-400',
          textColor: 'text-neutral-600',
          label: 'Voided by dispute',
        };
      default:
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          icon: Clock,
          iconColor: 'text-neutral-400',
          textColor: 'text-neutral-600',
          label: commitment.status,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Promised amount</p>
          <p className="text-2xl font-semibold text-neutral-900 tabular-nums">
            {formatCurrency(commitment.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-1">Due date</p>
          <div className="flex items-center gap-1.5 text-neutral-900">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="font-medium">
              {format(new Date(commitment.dueDate), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
        <span className="text-xs text-neutral-500">
          Recorded on {format(new Date(commitment.createdAt), 'MMM d')}
        </span>
        <span className="text-[10px] font-mono text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
          {commitment.id.split('-')[0]}
        </span>
      </div>
    </div>
  );
}
