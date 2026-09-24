'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOverview } from '@/components/admin/AdminOverview';

export default function AdminPage() {
  return (
    <AdminLayout title="Dashboard" subtitle="Overview of users, properties, bookings, and payments.">
      <AdminOverview />
    </AdminLayout>
  );
}
