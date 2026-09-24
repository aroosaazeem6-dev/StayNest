import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';
import { bookingService } from '@/lib/booking-service';
import { AvailabilityMessage, type AvailabilityStatus } from './AvailabilityMessage';

interface BookingCardProps {
  property: {
    id: string;
    title: string;
    pricePerNight: number;
    maxGuests: number;
    bedrooms: number | null;
    bathrooms: number | null;
    propertyType: string;
    city: string | null;
    country: string | null;
    status: string;
  };
  onBookingCreated?: (bookingId: string) => void;
}

export function BookingCard({ property, onBookingCreated }: BookingCardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, tokens } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityStatus>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  type Booking = Awaited<ReturnType<typeof bookingService.create>>;

  const maxGuests = Math.max(1, property.maxGuests ?? 1);

  /** Today's date as an ISO date string (YYYY-MM-DD). */
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  /** Tomorrow's date as an ISO date string (YYYY-MM-DD). */
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(`${checkIn}T00:00:00`);
    const b = new Date(`${checkOut}T00:00:00`);
    const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  })();

  const estimatedTotal = nights * property.pricePerNight;

  const validateDates = (): string | null => {
    if (!checkIn) return 'Check-in date is required.';
    if (!checkOut) return 'Check-out date is required.';
    if (checkIn >= checkOut) return 'Check-out must be after check-in.';
    if (checkIn < todayStr) return 'Check-in must be today or later.';
    return null;
  };

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailability('idle');
      return;
    }
    if (checkIn >= checkOut || checkIn < todayStr) {
      setAvailability('idle');
      return;
    }
    // Availability is checked on explicit user action, not automatically,
    // to avoid excessive requests while the user is still typing dates.
  }, [checkIn, checkOut, todayStr]);

  async function handleCheckAvailability() {
    const err = validateDates();
    if (err) {
      setDateError(err);
      setAvailability('error');
      setAvailabilityMessage(err);
      return;
    }
    setDateError(null);
    setAvailability('checking');
    setAvailabilityMessage(null);
    try {
      const res = await bookingService.checkAvailability(property.id, {
        checkIn,
        checkOut,
      });
      if (res.available) {
        setAvailability('available');
        setAvailabilityMessage('These dates are available.');
      } else {
        setAvailability('unavailable');
        setAvailabilityMessage('These dates are not available. Please choose different dates.');
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      setAvailability('error');
      setAvailabilityMessage(e?.message || 'Could not check availability. Please try again.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBookingError(null);

    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/properties/${property.id}`)}`);
      return;
    }

    if (user?.role !== UserRole.GUEST) {
      setBookingError('Only guest users can create bookings.');
      return;
    }

    const err = validateDates();
    if (err) {
      setDateError(err);
      return;
    }
    setDateError(null);

    if (guests < 1 || guests > maxGuests) {
      setBookingError(`Guests must be between 1 and ${maxGuests}.`);
      return;
    }

    if (availability !== 'available') {
      setBookingError('Please check availability for these dates before booking.');
      return;
    }

    if (!tokens?.accessToken) {
      setBookingError('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingService.create(
        {
          propertyId: property.id,
          checkIn,
          checkOut,
          guests,
        },
        tokens.accessToken,
      );
      setConfirmed(booking);
      if (onBookingCreated) {
        onBookingCreated(booking.id);
      } else {
        router.push('/bookings');
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      const status = e?.status;
      if (status === 409) {
        setBookingError('These dates are no longer available. Please choose different dates.');
      } else if (status === 403) {
        setBookingError('You are not allowed to create a booking.');
      } else if (status === 404) {
        setBookingError('Property not found.');
      } else if (status === 400) {
        setBookingError(e?.message || 'Invalid booking request. Please check your dates.');
      } else {
        setBookingError(e?.message || 'Unable to create booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h3 className="text-lg font-semibold text-green-800">Booking confirmed</h3>
        <dl className="mt-3 space-y-1 text-sm text-green-900">
          <div>
            <dt className="font-medium">Booking ID</dt>
            <dd className="font-mono">{confirmed.id}</dd>
          </div>
          <div>
            <dt className="font-medium">Property</dt>
            <dd>{confirmed.property.title}</dd>
          </div>
          <div>
            <dt className="font-medium">Check-in</dt>
            <dd>{confirmed.checkIn}</dd>
          </div>
          <div>
            <dt className="font-medium">Check-out</dt>
            <dd>{confirmed.checkOut}</dd>
          </div>
          <div>
            <dt className="font-medium">Guests</dt>
            <dd>{confirmed.guests}</dd>
          </div>
          <div>
            <dt className="font-medium">Total</dt>
            <dd>${confirmed.totalAmount}</dd>
          </div>
          <div>
            <dt className="font-medium">Status</dt>
            <dd>{confirmed.status}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Link href="/bookings" className="btn-primary">
            View my bookings
          </Link>
        </div>
      </div>
    );
  }

  const reserveLabel = submitting
    ? 'Booking…'
    : !isAuthenticated
      ? 'Login to reserve'
      : user?.role === UserRole.GUEST
        ? 'Reserve'
        : 'Sign up as guest to book';

  return (
    <div className="rounded-2xl border border-[#DDE3DA] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#26332D]">Book this stay</h3>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="checkIn" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Check-in
          </label>
          <input
            id="checkIn"
            type="date"
            min={todayStr}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              setAvailability('idle');
              setDateError(null);
            }}
            className="w-full rounded-lg border border-[#DDE3DA] px-3 py-2 text-sm outline-none focus:border-[#879B89] focus:ring-1 focus:ring-[#879B89]"
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="checkOut" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Check-out
          </label>
          <input
            id="checkOut"
            type="date"
            value={checkOut}
            min={tomorrowStr}
            onChange={(e) => {
              setCheckOut(e.target.value);
              setAvailability('idle');
              setDateError(null);
            }}
            className="w-full rounded-lg border border-[#DDE3DA] px-3 py-2 text-sm outline-none focus:border-[#879B89] focus:ring-1 focus:ring-[#879B89]"
            disabled={submitting}
          />
        </div>

        {dateError && <p className="text-xs text-red-600">{dateError}</p>}

        <div>
          <label htmlFor="guests" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Guests (max {maxGuests})
          </label>
          <select
            id="guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full rounded-lg border border-[#DDE3DA] px-3 py-2 text-sm outline-none focus:border-[#879B89] focus:ring-1 focus:ring-[#879B89]"
            disabled={submitting}
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCheckAvailability}
          disabled={submitting || !checkIn || !checkOut}
          className="btn-secondary w-full"
        >
          Check availability
        </button>

        <AvailabilityMessage status={availability} message={availabilityMessage} />

        {nights > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-[#F5F4EF] px-3 py-2 text-sm">
            <span className="text-[#6B756E]">
              {nights} night{nights === 1 ? '' : 's'}
            </span>
            <span className="font-semibold text-[#26332D]">
              ${estimatedTotal} <span className="font-normal text-[#6B756E]">est.</span>
            </span>
          </div>
        )}

        {bookingError && (
          <p role="alert" className="text-sm text-red-700">
            {bookingError}
          </p>
        )}

        {user && user.role !== UserRole.GUEST && (
          <p className="text-xs text-[#6B756E]">
            Only guest accounts can create bookings.
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            authLoading ||
            !isAuthenticated ||
            user?.role !== UserRole.GUEST ||
            availability !== 'available'
          }
          className="btn-primary w-full"
        >
          {reserveLabel}
        </button>
      </div>
    </div>
  );
}