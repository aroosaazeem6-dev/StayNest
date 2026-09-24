import { ReactNode } from 'react';

type AccentKey =
  | 'forest'
  | 'sage'
  | 'amber'
  | 'red'
  | 'blue'
  | 'purple'
  | 'slate'
  | 'emerald';

interface AdminStatCardProps {
  label: string;
  value: number | string;
  accent?: AccentKey;
  icon?: ReactNode;
  subtitle?: string;
}

const accentMap: Record<AccentKey, string> = {
  forest: 'bg-forest-900/10 text-forest-900',
  sage: 'bg-sage-600/10 text-sage-700',
  amber: 'bg-amber-500/10 text-amber-700',
  red: 'bg-red-500/10 text-red-700',
  blue: 'bg-blue-500/10 text-blue-700',
  purple: 'bg-purple-500/10 text-purple-700',
  slate: 'bg-slate-500/10 text-slate-700',
  emerald: 'bg-emerald-500/10 text-emerald-700',
};

export function AdminStatCard({
  label,
  value,
  accent = 'forest',
  icon,
  subtitle,
}: AdminStatCardProps) {
  const classes = accentMap[accent] ?? accentMap.forest;

  return (
    <div className="rounded-xl border border-sage-200/50 bg-white p-5 shadow-sm transition-shadow hover:shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-sage-500">
            {label}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-sage-400">{subtitle}</p>}
          <div className="mt-2 text-3xl font-bold text-forest-900">{value}</div>
        </div>
        {icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export default AdminStatCard;
