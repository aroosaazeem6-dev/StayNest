'use client';

import { Suspense } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PaymentManagement } from '@/components/admin/PaymentManagement';

const fallback = <div className="h-96 animate-pulse rounded-xl bg-sage-100" />;

export default function AdminPaymentsPage() {
  return (
    <AdminLayout title="Payments" subtitle="Browse all payments and update statuses.">
      <Suspense fallback={fallback}>
        <PaymentManagement />
      </Suspense>
    </AdminLayout>
  );
}
