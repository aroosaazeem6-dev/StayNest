'use client';

import { Suspense } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserManagement } from '@/components/admin/UserManagement';

const fallback = <div className="h-96 animate-pulse rounded-xl bg-sage-100" />;

export default function AdminUsersPage() {
  return (
    <AdminLayout title="Users" subtitle="Browse accounts, search, and update roles.">
      <Suspense fallback={fallback}>
        <UserManagement />
      </Suspense>
    </AdminLayout>
  );
}
