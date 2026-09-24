'use client';

import { Suspense } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PropertyManagement } from '@/components/admin/PropertyManagement';

const fallback = <div className="h-96 animate-pulse rounded-xl bg-sage-100" />;

export default function AdminPropertiesPage() {
  return (
    <AdminLayout title="Properties" subtitle="Browse all listings and update statuses.">
      <Suspense fallback={fallback}>
        <PropertyManagement />
      </Suspense>
    </AdminLayout>
  );
}
