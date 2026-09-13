import { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: number | string;
  accent?: string;
  icon?: ReactNode;
}

export function AdminStatCard({ label, value, accent = 'brand', icon }: AdminStatCardProps) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    slate: 'bg-slate-50 text-slate-700',
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {icon && (
          <span className={`rounded-lg p-2 ${colorMap[accent] ?? colorMap.brand}`}>{icon}</span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}