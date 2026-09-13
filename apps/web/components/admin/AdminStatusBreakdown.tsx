interface StatusRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function StatusRow({ label, value, total, color }: StatusRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">
          {value} <span className="text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-3">
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