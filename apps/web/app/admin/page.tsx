'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminOverview } from '@/components/admin/AdminOverview';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="container-section py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of users, properties, bookings, payments, and recent activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <AdminSidebar />
          <div>
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-gray-100" />}>
              <AdminOverview />
            </Suspense>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}