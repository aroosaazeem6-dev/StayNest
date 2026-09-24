'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { adminService, type AdminBooking } from '@/lib/admin-service';

export function BookingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { tokens } = useAuth();
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState('loading');
    adminService
      .getBooking(tokens.accessToken, id)
      .then((b) => {
        if (!mounted) return;
        setBooking(b);
        setState('success');
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState('error');
        setError(e?.status === 404 ? 'Booking not found.' : e?.message || 'Unable to load booking.');
      });
    return () => {
      mounted = false;
    };
  }, [id, tokens]);

  if (state === 'loading' || !booking) {
    return <div className="h-64 animate-pulse rounded-xl bg-sage-100" />;
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={() => router.refresh()} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sage-200/50 bg-white p-6 shadow-sm">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-sage-500">Booking ID</dt>
          <dd className="mt-1 font-mono text-sm text-forest-900">{booking.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Status</dt>
          <dd className="mt-1 text-sm text-forest-900">{booking.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Property</dt>
          <dd className="mt-1 text-sm text-forest-900">
            {booking.property?.title ?? booking.propertyId}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Guest</dt>
          <dd className="mt-1 text-sm text-forest-900">{booking.guest?.name ?? booking.guestId}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Check-in</dt>
          <dd className="mt-1 text-sm text-forest-900">{booking.checkIn}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Check-out</dt>
          <dd className="mt-1 text-sm text-forest-900">{booking.checkOut}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Guests</dt>
          <dd className="mt-1 text-sm text-forest-900">{booking.guests}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Total</dt>
          <dd className="mt-1 text-sm text-forest-900">${booking.totalAmount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sage-500">Created</dt>
          <dd className="mt-1 text-sm text-forest-900">
            {new Date(booking.createdAt).toLocaleString()}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex gap-3">
        <Link href="/admin/bookings" className="btn-secondary">
          Back to bookings
        </Link>
      </div>
    </div>
  );
}

export default BookingDetail;
