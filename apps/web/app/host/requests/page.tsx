'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  bookingService,
  type HostBooking,
} from '@/lib/booking-service';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';

export default function HostRequestsPage() {
  const { tokens, isLoading, user } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  const hasHostingCapability = Boolean(
    user && (user.role === UserRole.HOST || (user.role === UserRole.GUEST && user.isHost === true)),
  );

  const [requests, setRequests] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.findHostRequests(accessToken);
      setRequests(data.data);
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setError(e?.message || 'Unable to load booking requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    void fetchRequests();
  }, [accessToken, isLoading]);

  const handleAccept = async (id: string) => {
    if (!accessToken) return;
    setActionLoading(id);
    try {
      await bookingService.hostAccept(id, accessToken);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'HOST_ACCEPTED' } : r,
        ),
      );
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setError(e?.message || 'Unable to accept booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    if (!accessToken) return;
    setActionLoading(id);
    try {
      await bookingService.hostDecline(id, accessToken);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'HOST_DECLINED' } : r,
        ),
      );
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setError(e?.message || 'Unable to decline booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter(
    (r) => r.status === 'PENDING',
  );
  const resolvedRequests = requests.filter(
    (r) => r.status !== 'PENDING',
  );

  return (
    <ProtectedRoute allowedRoles={[UserRole.HOST, UserRole.GUEST]}>
      {!hasHostingCapability ? (
        <DashboardLayout>
          <div className="container-section py-16">
            <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h2 className="text-xl font-semibold text-amber-900">
                Hosting not enabled
              </h2>
              <p className="mt-2 text-sm text-amber-800">
                Your account does not have hosting capability yet.
              </p>
            </div>
          </div>
        </DashboardLayout>
      ) : (
        <DashboardLayout>
          <div className="space-y-8">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[#26332D]">
                Booking Requests
              </h1>
              <p className="mt-1.5 text-sm text-[#6B756E]">
                Manage incoming booking requests for your properties.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-[#DDE3DA] bg-white p-8 text-center text-[#6B756E]">
                Loading booking requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DDE3DA] bg-white p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1E7] text-[#879B89]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-7 w-7"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  >
                    <path d="M4 4h16v16H4z" rx="2" />
                    <path d="M8 9h8M8 13h5M8 17h3" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[#26332D]">
                  No booking requests yet
                </h2>
                <p className="mt-1.5 text-sm text-[#6B756E]">
                  When guests book your properties, requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {pendingRequests.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-[#26332D]">
                      Pending Requests
                    </h2>
                    <div className="mt-4 space-y-4">
                      {pendingRequests.map((booking) => (
                        <HostBookingCard
                          key={booking.id}
                          booking={booking}
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {resolvedRequests.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-[#26332D]">
                      Resolved Requests
                    </h2>
                    <div className="mt-4 space-y-4">
                      {resolvedRequests.map((booking) => (
                        <HostBookingCard
                          key={booking.id}
                          booking={booking}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}

interface HostBookingCardProps {
  booking: HostBooking;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  actionLoading: string | null;
}

function HostBookingCard({
  booking,
  onAccept,
  onDecline,
  actionLoading,
}: HostBookingCardProps) {
  const isPending = booking.status === 'PENDING';
  const canAct = isPending && onAccept && onDecline;

  return (
    <div className="rounded-2xl border border-[#DDE3DA] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {booking.property.coverImage ? (
            <img
              src={booking.property.coverImage}
              alt={booking.property.title}
              className="h-20 w-24 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-[#F0F4ED] text-[#879B89]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
                <path d="M4 7h15" strokeLinecap="round" />
                <path d="M15 13h4" />
                <circle cx="15" cy="13" r=".8" fill="currentColor" stroke="none" />
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#849083]">
              {booking.property.city}, {booking.property.country}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#26332D]">
              {booking.property.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6B756E]">
              <span>
                {booking.guests} guest{booking.guests > 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span>
                {booking.checkIn} to {booking.checkOut}
              </span>
              <span>•</span>
              <span>${booking.totalAmount}</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="font-medium text-[#26332D]">
                {booking.guest.name}
              </span>
              <span className="text-[#B8C7B9]">•</span>
              <span className="text-[#6B756E]">{booking.guest.email}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <BookingStatusBadge status={booking.status} />

          {canAct && (
            <>
              <button
                type="button"
                onClick={() => onAccept(booking.id)}
                disabled={actionLoading === booking.id}
                className="rounded-lg border border-[#879B89] px-4 py-2 text-sm font-semibold text-[#526653] transition hover:bg-[#F0F4ED] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === booking.id ? 'Processing…' : 'Accept'}
              </button>
              <button
                type="button"
                onClick={() => onDecline(booking.id)}
                disabled={actionLoading === booking.id}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === booking.id ? 'Processing…' : 'Decline'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
