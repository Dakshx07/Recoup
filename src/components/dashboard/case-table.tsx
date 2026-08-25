import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StatusBadge, EscalationBadge } from './status-badge';
import { formatSimulatedTimeAgo } from '@/lib/simulated-time';

export interface CaseRowData {
  id: string;
  invoiceNumber: string;
  debtorName: string;
  outstandingAmount: number;
  state: string;
  escalationLevel?: string;
  lastActivityAt: string | Date;
}

interface CaseTableProps {
  cases: CaseRowData[];
  isLoading?: boolean;
  isEmpty?: boolean;
  /** Current simulated time — used for relative time display */
  simulatedNow?: string | Date;
}

export function CaseTable({ cases, isLoading, isEmpty, simulatedNow }: CaseTableProps) {
  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const formatTimeAgo = (dateInput: string | Date) => {
    if (simulatedNow) {
      return formatSimulatedTimeAgo(dateInput, simulatedNow);
    }
    // Fallback: absolute date if no simulated clock available
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="divide-y divide-neutral-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-2 w-1/3">
                <div className="h-4 bg-neutral-200 rounded animate-pulse w-24"></div>
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-32"></div>
              </div>
              <div className="h-6 bg-neutral-200 rounded-full animate-pulse w-20"></div>
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty || cases.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
        <p className="text-sm font-medium text-neutral-900">No cases found</p>
        <p className="text-sm text-neutral-500 mt-1">
          There are no cases matching the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Invoice & Debtor</th>
              <th className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider text-right">Outstanding</th>
              <th className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Last Activity</th>
              <th className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {cases.map((row) => {
              const isEscalated =
                row.state === 'ESCALATED' ||
                (row.escalationLevel && row.escalationLevel !== 'NONE');

              return (
                <tr
                  key={row.id}
                  className="group relative hover:bg-neutral-50/70 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    {isEscalated && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />
                    )}
                    <Link
                      href={`/app/cases/${row.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View case ${row.invoiceNumber}`}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-neutral-400">
                        {row.invoiceNumber}
                      </span>
                      <span className="font-medium text-sm text-neutral-900 mt-0.5">
                        {row.debtorName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-neutral-900 tabular-nums text-sm">
                    {formatCurrency(row.outstandingAmount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge state={row.state} />
                      <EscalationBadge level={row.escalationLevel || 'NONE'} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 text-xs">
                    {formatTimeAgo(row.lastActivityAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center text-blue-600 font-medium text-xs group-hover:underline">
                      View
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
