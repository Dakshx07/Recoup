import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { StatusBadge, EscalationBadge } from './status-badge';

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
}

export function CaseTable({ cases, isLoading, isEmpty }: CaseTableProps) {
  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const formatTimeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Unknown';
    return formatDistanceToNow(date, { addSuffix: true });
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
              <th className="px-4 py-3 font-medium">Invoice & Debtor</th>
              <th className="px-4 py-3 font-medium text-right">Outstanding</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Activity</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
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
                  className="group relative hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {isEscalated && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                    )}
                    <Link
                      href={`/app/cases/${row.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View case ${row.invoiceNumber}`}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-neutral-500">
                        {row.invoiceNumber}
                      </span>
                      <span className="font-medium text-neutral-900 mt-0.5">
                        {row.debtorName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900 tabular-nums">
                    {formatCurrency(row.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge state={row.state} />
                      <EscalationBadge level={row.escalationLevel || 'NONE'} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {formatTimeAgo(row.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center text-blue-600 font-medium text-xs group-hover:underline">
                      View details
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
