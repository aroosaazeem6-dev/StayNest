import { AdminDashboardOverview } from '@/lib/admin-service';

interface RecentItem {
  id: string;
  label: string;
  meta: string;
  href?: string;
}

function RecentList({ title, items }: { title: string; items: RecentItem[] }) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-xs text-gray-400">None yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-gray-900">{item.label}</span>
              <span className="shrink-0 text-xs text-gray-400">
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
    label: `Booking ${b.id.slice(0, 8)}`,
    meta: b.createdAt,
  }));

  const payments: RecentItem[] = (recentActivity?.recentPayments ?? []).map((p) => ({
    id: p.id,
    label: `${p.provider ?? 'Payment'} — $${p.amount} ${p.currency}`,
    meta: p.createdAt,
  }));

  const reviews: RecentItem[] = (recentActivity?.recentReviews ?? []).map((r) => ({
    id: r.id,
    label: `Review ${r.rating}★`,
    meta: r.createdAt,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <RecentList title="Recent bookings" items={bookings} />
        <RecentList title="Recent payments" items={payments} />
        <RecentList title="Recent reviews" items={reviews} />
      </div>
    </div>
  );
}