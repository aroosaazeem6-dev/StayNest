'use client';

import { useState } from 'react';
import { bookingService, type Booking } from '@/lib/booking-service';
import { ReviewForm } from './ReviewForm';

interface BookingRowProps {
  booking: Booking;
  highlighted?: boolean;
  accessToken: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

export function BookingRow({ booking, highlighted, accessToken }: BookingRowProps) {
  const [expanded, setExpanded] = useState(!!highlighted);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [current, setCurrent] = useState(booking);

  async function handleCancel() {
    if (!confirm('Cancel this booking? This action cannot be undone.')) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await bookingService.cancel(booking.id, accessToken);
      setCurrent(updated);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      setCancelError(
        e?.status === 400
          ? 'This booking cannot be cancelled.'
          : e?.status === 409
            ? 'Booking state changed. Please refresh.'
            : e?.message || 'Unable to cancel booking.',
      );
    } finally {
      setCancelling(false);
    }
  }

  const isCancellable = current.status === 'PENDING' || current.status === 'CONFIRMED';
  const canReview = current.status === 'COMPLETED';

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        highlighted ? 'border-brand-500' : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {booking.property.title}
            </h3>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {booking.status}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-500">
            {[booking.property.city, booking.property.country]
              .filter(Boolean)
              .join(', ') || 'Location TBA'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Check-in</div>
            <div className="font-medium text-gray-900">{booking.checkIn}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Check-out</div>
            <div className="font-medium text-gray-900">{booking.checkOut}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Guests</div>
            <div className="font-medium text-gray-900">{booking.guests}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-900">${booking.totalAmount}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {cancelError && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {cancelError}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">Booking ID</dt>
              <dd className="mt-0.5 font-mono text-gray-900">{current.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Property type</dt>
              <dd className="mt-0.5 text-gray-900">{current.property.propertyType}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Created</dt>
              <dd className="mt-0.5 text-gray-900">
                {new Date(current.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isCancellable && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-secondary !py-2 !px-4 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
            )}
            {canReview && <ReviewForm booking={current} accessToken={accessToken} />}
          </div>
        </div>
      )}
    </div>
  );
}