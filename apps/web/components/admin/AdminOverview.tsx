'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { adminService, type AdminDashboardOverview } from '@/lib/admin-service';
import { AdminStatCard } from './AdminStatCard';
import { AdminStatusBreakdown } from './AdminStatusBreakdown';
import { AdminRecentActivity } from './AdminRecentActivity';
import { AdminIcons } from './icons';

const statCardClass = 'rounded-xl border border-sage-200/50 bg-white shadow-sm';

export function AdminOverview() {
  const { tokens } = useAuth();
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tokens?.accessToken) return;

    setState('loading');
    setError(null);

    try {
      const data = await adminService.getDashboardOverview(tokens.accessToken);
      setOverview(data);
      setState('success');
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      setState('error');
      setError(e?.message || 'Unable to load dashboard overview.');
    }
  }, [tokens]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (state === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-sage-100" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={statCardClass + ' p-8'}>
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total Users"
          value={overview.users}
          accent="forest"
          icon={<AdminIcons.users className="h-6 w-6" />}
        />
        <AdminStatCard
          label="Total Properties"
          value={overview.properties}
          accent="sage"
          icon={<AdminIcons.properties className="h-6 w-6" />}
        />
        <AdminStatCard
          label="Total Bookings"
          value={overview.bookings.total}
          accent="amber"
          icon={<AdminIcons.bookings className="h-6 w-6" />}
        />
        <AdminStatCard
          label="Total Payments"
          value={overview.payments.total}
          accent="blue"
          icon={<AdminIcons.payments className="h-6 w-6" />}
        />
        <AdminStatCard
          label="Reviews"
          value={overview.reviews}
          accent="purple"
        />
        <AdminStatCard
          label="Favorites"
          value={overview.favorites}
          accent="slate"
        />
        <AdminStatCard
          label="Host-Accepted Bookings"
          value={overview.bookings.hostAccepted ?? 0}
          accent="emerald"
        />
        <AdminStatCard
          label="Host-Declined Bookings"
          value={overview.bookings.hostDeclined ?? 0}
          accent="red"
        />
      </div>

      {/* Analytics / Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminStatusBreakdown
          title="Bookings"
          total={overview.bookings.total}
          rows={[
            { label: 'Pending', value: overview.bookings.pending, total: overview.bookings.total, color: 'bg-amber-500' },
            { label: 'Host Accepted', value: overview.bookings.hostAccepted ?? 0, total: overview.bookings.total, color: 'bg-emerald-500' },
            { label: 'Host Declined', value: overview.bookings.hostDeclined ?? 0, total: overview.bookings.total, color: 'bg-red-500' },
            { label: 'Confirmed', value: overview.bookings.confirmed, total: overview.bookings.total, color: 'bg-green-500' },
            { label: 'Cancelled', value: overview.bookings.cancelled, total: overview.bookings.total, color: 'bg-gray-400' },
            { label: 'Completed', value: overview.bookings.completed, total: overview.bookings.total, color: 'bg-blue-500' },
          ]}
        />
        <AdminStatusBreakdown
          title="Payments"
          total={overview.payments.total}
          rows={[
            { label: 'Pending', value: overview.payments.pending, total: overview.payments.total, color: 'bg-amber-500' },
            { label: 'Succeeded', value: overview.payments.succeeded, total: overview.payments.total, color: 'bg-green-500' },
            { label: 'Failed', value: overview.payments.failed, total: overview.payments.total, color: 'bg-red-500' },
            { label: 'Refunded', value: overview.payments.refunded, total: overview.payments.total, color: 'bg-purple-500' },
          ]}
        />
      </div>

      {/* Recent Activity */}
      <AdminRecentActivity overview={overview} />
    </div>
  );
}

export default AdminOverview;
