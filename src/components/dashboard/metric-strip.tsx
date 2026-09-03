/**
 * Metric strip — 4-metric card row per 06_UI_UX_DESIGN.md and 07_REVIEW_NOTES.md §C1.
 *
 * Design decision per C1:
 * No colored-icon-in-a-rounded-box (the AI-dashboard giveaway).
 * Clean typographic cards with a subtle 2px left-edge indicator bar that
 * reuses the exact visual language of the table's escalated left-edge line.
 */

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  color: 'green' | 'red' | 'amber' | 'blue' | 'neutral';
}

const COLOR_MAP = {
  green: {
    border: 'border-l-green-600',
    value: 'text-neutral-900',
  },
  red: {
    border: 'border-l-red-600',
    value: 'text-neutral-900',
  },
  amber: {
    border: 'border-l-amber-500',
    value: 'text-neutral-900',
  },
  blue: {
    border: 'border-l-blue-600',
    value: 'text-neutral-900',
  },
  neutral: {
    border: 'border-l-neutral-400',
    value: 'text-neutral-900',
  },
};

function MetricCard({ label, value, subtext, color }: MetricCardProps) {
  const style = COLOR_MAP[color];
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 border-l-4 ${style.border} p-4 hover:border-neutral-300 hover:shadow-2xs transition-all duration-150 motion-reduce:transition-none`}>
      <p className="text-xs text-neutral-600 font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1 tabular-nums text-neutral-900 tracking-tight">
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-neutral-500 mt-1 font-medium">{subtext}</p>
      )}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <MetricCard
        label="Recovered"
        value={formatCurrency(recovered)}
        subtext={`${recoveryRate}% overall recovery rate`}
        color="green"
      />
      <MetricCard
        label="At risk"
        value={formatCurrency(atRisk)}
        subtext="Active outstanding balance"
        color="amber"
      />
      <MetricCard
        label="Active cases"
        value={activeCases.toString()}
        subtext="In recovery pipeline"
        color="blue"
      />
      <MetricCard
        label="Escalated"
        value={escalated.toString()}
        subtext="Requires human review / handoff"
        color="red"
      />
    </div>
  );
}
