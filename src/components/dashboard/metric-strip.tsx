/**
 * Metric strip — 4-metric card row reused across Overview and Case Queue.
 */

import { TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'amber' | 'blue' | 'neutral';
}

const COLOR_MAP = {
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    value: 'text-green-900',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    value: 'text-red-900',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    value: 'text-amber-900',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    value: 'text-blue-900',
  },
  neutral: {
    bg: 'bg-neutral-50',
    icon: 'text-neutral-600',
    value: 'text-neutral-900',
  },
};

function MetricCard({ label, value, subtext, icon, color }: MetricCardProps) {
  const colors = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p className={`text-2xl font-semibold mt-1 tabular-nums ${colors.value}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-neutral-400 mt-0.5">{subtext}</p>
          )}
        </div>
        <div className={`p-2 rounded-md ${colors.bg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface MetricStripProps {
  recovered: number;
  atRisk: number;
  activeCases: number;
  escalated: number;
  totalAmount: number;
}

export function MetricStrip({
  recovered,
  atRisk,
  activeCases,
  escalated,
  totalAmount,
}: MetricStripProps) {
  const recoveryRate = totalAmount > 0 ? ((recovered / totalAmount) * 100).toFixed(1) : '0';
  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Recovered"
        value={formatCurrency(recovered)}
        subtext={`${recoveryRate}% recovery rate`}
        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        color="green"
      />
      <MetricCard
        label="At risk"
        value={formatCurrency(atRisk)}
        subtext="Outstanding amount"
        icon={<TrendingDown className="w-5 h-5 text-red-600" />}
        color="red"
      />
      <MetricCard
        label="Active cases"
        value={activeCases.toString()}
        subtext="In recovery pipeline"
        icon={<Activity className="w-5 h-5 text-blue-600" />}
        color="blue"
      />
      <MetricCard
        label="Escalated"
        value={escalated.toString()}
        subtext="Needs attention"
        icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        color="amber"
      />
    </div>
  );
}
