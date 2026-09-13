import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BookingManagement } from '@/components/admin/BookingManagement';

export const metadata = {
  title: 'Bookings — StayNest Admin',
  description: 'Manage StayNest bookings.',
};

export default function AdminBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="container-section py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bookings</h1>
          <p className="mt-2 text-gray-600">
            Browse all bookings and update statuses.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <AdminSidebar />
          <div>
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-gray-100" />}>
              <BookingManagement />
            </Suspense>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}