'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { bookingService, type Booking } from '@/lib/booking-service';
import { BookingRow } from './BookingRow';

export function BookingList() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, tokens } = useAuth();

  const [page, setPage] = useState(1);
  const [state, setState] = useState<{
    status: 'loading' | 'success' | 'error' | 'empty';
    data: Booking[] | null;
    meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } | null;
    error: string | null;
  }>({ status: 'loading', data: null, meta: null, error: null });

  const highlightId = searchParams.get('booking');

  useEffect(() => {
    if (authLoading || !isAuthenticated || !tokens?.accessToken) return;
    let mounted = true;
    setState((s) => ({ ...s, status: 'loading' }));
    bookingService
      .findMyBookings(tokens.accessToken, page)
      .then((res) => {
        if (!mounted) return;
        if (res.data.length === 0) {
          setState({ status: 'empty', data: null, meta: null, error: null });
        } else {
          setState({ status: 'success', data: res.data, meta: res.meta, error: null });
        }
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState({
          status: 'error',
          data: null,
          meta: null,
          error: e?.status === 401 ? 'Session expired. Please log in again.' : e?.message || 'Unable to load bookings.',
        });
      });
    return () => {
      mounted = false;
    };
  }, [page, authLoading, isAuthenticated, tokens]);

  if (authLoading || !isAuthenticated) {
    return <LoadingState />;
  }

  if (state.status === 'loading') {
    return <LoadingState />;
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{state.error}</p>
        <button onClick={() => setPage((p) => p)} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'empty' || !state.data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-700">No bookings yet</p>
        <p className="mt-1 text-sm text-gray-500">
          You haven&#39;t booked any stays. Explore properties to get started.
        </p>
        <Link href="/properties" className="btn-primary mt-4">
          Explore stays
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {state.data.map((booking) => (
          <BookingRow
            key={booking.id}
            booking={booking}
            highlighted={booking.id === highlightId}
            accessToken={tokens!.accessToken}
          />
        ))}
      </div>

      {state.meta && state.meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {state.meta.page} of {state.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!state.meta.hasPrev}
              className="btn-secondary !py-2 !px-4 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!state.meta.hasNext}
              className="btn-secondary !py-2 !px-4 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}