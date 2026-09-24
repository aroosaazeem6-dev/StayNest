import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BookingList } from '@/components/dashboard/BookingList';

export const metadata = {
  title: 'My Bookings — StayNest',
  description: 'View and manage your StayNest bookings.',
};

export default function BookingsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#26332D]">
          My Bookings
        </h1>
        <p className="mt-1.5 text-sm text-[#6B756E]">
          View, manage, and review your StayNest bookings.
        </p>
      </div>

      <Suspense fallback={<BookingsSkeleton />}>
        <BookingList />
      </Suspense>
    </DashboardLayout>
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl border border-[#DDE3DA] bg-white"
        />
      ))}
    </div>
  );
}