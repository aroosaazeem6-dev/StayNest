import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { Suspense } from 'react';
import { BookingList } from '@/components/dashboard/BookingList';

export const metadata = {
  title: 'My Bookings — StayNest',
  description: 'View and manage your StayNest bookings.',
};

export default function BookingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
      <div className="container-section py-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Bookings</h1>
        <p className="mt-2 text-gray-600">
          View, manage, and review your StayNest bookings.
        </p>
        <div className="mt-6">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100" />}>
            <BookingList />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}