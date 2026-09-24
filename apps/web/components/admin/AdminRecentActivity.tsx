'use client';

import type { AdminDashboardOverview } from '@/lib/admin-service';
import { AdminIcons } from '@/components/admin/icons';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-800',
    HOST_ACCEPTED: 'bg-emerald-500/10 text-emerald-800',
    HOST_DECLINED: 'bg-red-500/10 text-red-800',
    CONFIRMED: 'bg-green-500/10 text-green-800',
    CANCELLED: 'bg-gray-400/10 text-gray-600',
    COMPLETED: 'bg-blue-500/10 text-blue-800',
    SUCCEEDED: 'bg-green-500/10 text-green-800',
    FAILED: 'bg-red-500/10 text-red-800',
    REFUNDED: 'bg-purple-500/10 text-purple-800',
  };
  const cls = styles[status] ?? 'bg-sage-500/10 text-sage-800';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

interface RecentItem {
  id: string;
  label: string;
  meta: string;
  status?: string;
  href?: string;
}

function RecentList({ title, items }: { title: string; items: RecentItem[] }) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-forest-900">{title}</h3>
        <p className="mt-2 text-xs text-sage-400">None yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-semibold text-forest-900">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-sage-200/50 bg-sage-25 p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block truncate font-medium text-forest-900">
                  {item.label}
                </span>
                {item.status && (
                  <StatusBadge status={item.status} />
                )}
              </div>
              <span className="shrink-0 text-xs text-sage-400">
                {new Date(item.meta).toLocaleDateString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AdminRecentActivityProps {
  overview: AdminDashboardOverview;
}

export function AdminRecentActivity({ overview }: AdminRecentActivityProps) {
  const { recentActivity } = overview;

  const bookings: RecentItem[] = (recentActivity?.recentBookings ?? []).map((b) => ({
    id: b.id,
    label: `Booking ${b.id.slice(0, 8)} — ${b.propertyId.slice(0, 6)}`,
    meta: b.createdAt,
    status: b.status,
  }));

  const payments: RecentItem[] = (recentActivity?.recentPayments ?? []).map((p) => ({
    id: p.id,
    label: `${p.provider ?? 'Payment'} — $${p.amount} ${p.currency}`,
    meta: p.createdAt,
    status: p.status,
  }));

  const reviews: RecentItem[] = (recentActivity?.recentReviews ?? []).map((r) => ({
    id: r.id,
    label: `Review ${r.rating}★ on ${r.propertyId.slice(0, 6)}`,
    meta: r.createdAt,
  }));

  return (
    <div className="rounded-xl border border-sage-200/50 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <AdminIcons.bookings className="h-5 w-5 text-sage-700" />
        <h2 className="text-lg font-semibold text-forest-900">Recent Activity</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <RecentList title="Recent bookings" items={bookings} />
        <RecentList title="Recent payments" items={payments} />
        <RecentList title="Recent reviews" items={reviews} />
      </div>
    </div>
  );
}

export default AdminRecentActivity;
