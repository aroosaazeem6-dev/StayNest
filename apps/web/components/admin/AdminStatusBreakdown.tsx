'use client';

interface StatusRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function StatusRow({ label, value, total, color }: StatusRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-sm">
        <span className="text-sage-600">{label}</span>
        <span className="font-medium text-forest-900">
          {value} <span className="text-sage-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-sage-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface AdminStatusBreakdownProps {
  title: string;
  rows: StatusRowProps[];
  total: number;
}

export function AdminStatusBreakdown({ title, rows, total }: AdminStatusBreakdownProps) {
  return (
    <div className="rounded-xl border border-sage-200/50 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-forest-900">{title}</h3>
        <span className="text-xs text-sage-400">{total} total</span>
      </div>
      <div className="mt-4">
        {rows.map((row) => (
          <StatusRow
            key={row.label}
            label={row.label}
            value={row.value}
            total={total}
            color={row.color}
          />
        ))}
      </div>
    </div>
  );
}

export default AdminStatusBreakdown;
