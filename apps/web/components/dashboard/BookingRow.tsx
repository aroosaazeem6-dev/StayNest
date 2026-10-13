'use client';

import { useEffect, useState } from 'react';
import { bookingService, type Booking } from '@/lib/booking-service';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { ReviewForm } from './ReviewForm';

interface BookingRowProps {
  booking: Booking;
  highlighted?: boolean;
  accessToken: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  HOST_ACCEPTED: 'bg-indigo-100 text-indigo-700',
  HOST_DECLINED: 'bg-purple-100 text-purple-700',
  PAYMENT_REQUIRED: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Waiting for host approval',
  HOST_ACCEPTED: 'Waiting for admin approval',
  HOST_DECLINED: 'Declined by host',
  PAYMENT_REQUIRED: 'Payment Required',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  PENDING: 'Your booking request is awaiting host approval.',
  HOST_ACCEPTED: 'The host accepted your request. Awaiting admin review before payment.',
  HOST_DECLINED: 'The host declined your booking request.',
  PAYMENT_REQUIRED: 'Payment is required to confirm your booking. Your status updates once the payment provider processes the callback.',
  CONFIRMED: 'Payment successful — your booking is confirmed.',
  CANCELLED: 'This booking was cancelled.',
  COMPLETED: 'Your stay is complete.',
};

export function BookingRow({ booking, highlighted, accessToken }: BookingRowProps) {
  const [expanded, setExpanded] = useState(!!highlighted);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [current, setCurrent] = useState(booking);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    setCurrent(booking);
  }, [booking]);

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
  const needsPayment = current.status === 'PAYMENT_REQUIRED';

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
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-500">
            {[booking.property.city, booking.property.country]
              .filter(Boolean)
              .join(', ') || 'Location TBA'}
          </p>
          {STATUS_DESCRIPTIONS[current.status] && (
            <p className="mt-1 text-xs text-gray-500">
              {STATUS_DESCRIPTIONS[current.status]}
            </p>
          )}
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
          {needsPayment && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
            >
              Make Payment
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {paymentModalOpen && (
        <PaymentModal
          bookingId={booking.id}
          propertyTitle={booking.property.title}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          guests={booking.guests}
          totalAmount={booking.totalAmount}
          accessToken={accessToken}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}

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