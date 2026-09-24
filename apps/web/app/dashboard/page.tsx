'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" d="m16 16 5 5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 9.5V20h14V9.5M9 20v-6h6v6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path strokeLinecap="round" d="M7 3v4M17 3v4M3.5 10h17" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.8 4.8 0 0 1 8 4c1.6 0 3.1.8 4 2.1A4.8 4.8 0 0 1 20.8 8.8Z"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, becomeHost } = useAuth();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = Boolean(
    user && (user.isHost === true || user.role === UserRole.HOST),
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  const openConfirm = () => {
    setError(null);
    setConfirmOpen(true);
  };

  const cancelOnboarding = () => {
    if (busy) return;
    setConfirmOpen(false);
  };

  const confirmOnboarding = async () => {
    setBusy(true);
    setError(null);

    try {
      const updated = await becomeHost();

      if (!updated) {
        setError('Could not complete host onboarding. Please try again.');
        return;
      }

      setConfirmOpen(false);
      router.push('/host');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <section>
          <p className="text-sm font-medium tracking-wide text-[#738274]">
            YOUR STAYNEST
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#26332D] sm:text-4xl">
            Good to see you, {firstName}
          </h1>

          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#707970]">
            Find a place that feels like home, manage your stays, or start
            hosting your own property.
          </p>
        </section>

        {/* Main actions */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Find a stay */}
          <Link
            href="/properties"
            className="group relative min-h-[270px] overflow-hidden rounded-[28px] bg-[#26332D] p-7 text-white shadow-[0_12px_35px_rgba(38,51,45,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(38,51,45,0.18)] sm:p-9"
          >
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#DDE8D9]">
                <SearchIcon />
              </div>

              <div className="mt-auto pt-12">
                <p className="text-sm font-medium text-[#B8C7B9]">
                  EXPLORE
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Find your next stay
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#C8D0CA]">
                  Discover properties, compare amenities, check availability,
                  and plan your next trip.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Explore stays
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -right-10 h-64 w-64 rounded-full border border-white/5" />
          </Link>

          {/* Host */}
          <div className="relative min-h-[270px] overflow-hidden rounded-[28px] border border-[#DDE3DA] bg-white p-7 shadow-[0_8px_30px_rgba(38,51,45,0.06)] sm:p-9">
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E7] text-[#526653]">
                <HomeIcon />
              </div>

              <div className="mt-auto pt-12">
                <p className="text-sm font-medium text-[#849083]">
                  {isHost ? 'HOSTING' : 'GROW WITH STAYNEST'}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#26332D] sm:text-3xl">
                  {isHost ? 'Manage your properties' : 'Host your property'}
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#707970]">
                  {isHost
                    ? 'Manage your listings and continue building your hosting experience.'
                    : 'Share your property with travelers while keeping your guest account.'}
                </p>

                <div className="mt-6">
                  {isHost ? (
                    <Link
                      href="/host"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#526653] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#435645]"
                    >
                      Manage properties
                      <span>→</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={openConfirm}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#526653] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#435645] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <PlusIcon />
                      Become a host
                    </button>
                  )}
                </div>

                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[#F0F4ED]" />
          </div>
        </section>

        {/* Quick access */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium tracking-wide text-[#849083]">
                QUICK ACCESS
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#26332D]">
                Your StayNest
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/bookings"
              className="group rounded-2xl border border-[#E0E4DE] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#C9D4C6] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4ED] text-[#526653]">
                <CalendarIcon />
              </div>

              <h3 className="mt-4 font-semibold text-[#26332D]">
                My bookings
              </h3>

              <p className="mt-1 text-sm text-[#7A827A]">
                View your reservations and stay details.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-[#526653]">
                View bookings →
              </span>
            </Link>

            <Link
              href="/favorites"
              className="group rounded-2xl border border-[#E0E4DE] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#C9D4C6] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4ED] text-[#526653]">
                <HeartIcon />
              </div>

              <h3 className="mt-4 font-semibold text-[#26332D]">
                Saved stays
              </h3>

              <p className="mt-1 text-sm text-[#7A827A]">
                Keep track of properties you would like to visit.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-[#526653]">
                View favorites →
              </span>
            </Link>

            <Link
              href="/profile"
              className="group rounded-2xl border border-[#E0E4DE] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#C9D4C6] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4ED] text-[#526653]">
                <span className="text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-[#26332D]">
                My profile
              </h3>

              <p className="mt-1 text-sm text-[#7A827A]">
                Manage your account information and preferences.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-[#526653]">
                Open profile →
              </span>
            </Link>
          </div>
        </section>

        {/* Host reminder */}
        {isHost && (
          <section className="rounded-[24px] border border-[#DDE5D9] bg-[#EEF4EC] p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#72816F]">
                  HOSTING
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[#344337]">
                  Your hosting tools are ready
                </h2>

                <p className="mt-1 text-sm text-[#68776B]">
                  Add or manage your properties from your hosting dashboard.
                </p>
              </div>

              <Link
                href="/host"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#526653] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#435645]"
              >
                Open hosting
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Become host modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#172019]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="become-host-title"
        >
          <div className="w-full max-w-md rounded-[26px] border border-[#E1E5DF] bg-white p-7 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E7] text-[#526653]">
              <HomeIcon />
            </div>

            <h3
              id="become-host-title"
              className="mt-5 text-xl font-semibold text-[#26332D]"
            >
              Become a Host
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#707970]">
              Add hosting capability to your existing StayNest account. You
              will still be able to browse stays, make bookings, and keep your
              favorites.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelOnboarding}
                disabled={busy}
                className="rounded-xl border border-[#DDE2DC] px-5 py-3 text-sm font-semibold text-[#59635A] transition hover:bg-[#F7F8F5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmOnboarding}
                disabled={busy}
                className="rounded-xl bg-[#526653] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#435645] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Setting up…' : 'Become a Host'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}