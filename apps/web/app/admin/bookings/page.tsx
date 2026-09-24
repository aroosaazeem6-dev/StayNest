'use client';

import { Suspense } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BookingManagement } from '@/components/admin/BookingManagement';

const fallback = <div className="h-96 animate-pulse rounded-xl bg-sage-100" />;

export default function AdminBookingsPage() {
  return (
    <AdminLayout title="Bookings" subtitle="Browse all bookings and update statuses.">
      <Suspense fallback={fallback}>
        <BookingManagement />
      </Suspense>
    </AdminLayout>
  );
}
