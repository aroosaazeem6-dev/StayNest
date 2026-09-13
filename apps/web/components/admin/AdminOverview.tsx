'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { adminService, type AdminDashboardOverview } from '@/lib/admin-service';
import { AdminStatCard } from './AdminStatCard';
import { AdminStatusBreakdown } from './AdminStatusBreakdown';
import { AdminRecentActivity } from './AdminRecentActivity';

export function AdminOverview() {
  const { tokens } = useAuth();
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState('loading');
    adminService
      .getDashboardOverview(tokens.accessToken)
      .then((data) => {
        if (!mounted) return;
        setOverview(data);
        setState('success');
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState('error');
        setError(e?.message || 'Unable to load dashboard overview.');
      });
    return () => {
      mounted = false;
    };
  }, [tokens]);

  if (state === 'loading' || !overview) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Users" value={overview.users} accent="brand" />
        <AdminStatCard label="Properties" value={overview.properties} accent="green" />
        <AdminStatCard label="Bookings" value={overview.bookings.total} accent="amber" />
        <AdminStatCard label="Payments" value={overview.payments.total} accent="blue" />
        <AdminStatCard label="Reviews" value={overview.reviews} accent="purple" />
        <AdminStatCard label="Favorites" value={overview.favorites} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminStatusBreakdown
          title="Bookings"
          total={overview.bookings.total}
          rows={[
            { label: 'Pending', value: overview.bookings.pending, total: overview.bookings.total, color: 'bg-amber-500' },
            { label: 'Confirmed', value: overview.bookings.confirmed, total: overview.bookings.total, color: 'bg-green-500' },
            { label: 'Cancelled', value: overview.bookings.cancelled, total: overview.bookings.total, color: 'bg-red-500' },
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
        <AdminStatusBreakdown
          title="Properties"
          total={overview.properties}
          rows={[
            { label: 'Draft', value: overview.propertyStatuses.draft, total: overview.properties, color: 'bg-slate-500' },
            { label: 'Active', value: overview.propertyStatuses.active, total: overview.properties, color: 'bg-green-500' },
            { label: 'Archived', value: overview.propertyStatuses.archived, total: overview.properties, color: 'bg-gray-400' },
          ]}
        />
      </div>

      <AdminRecentActivity overview={overview} />
    </div>
  );
}