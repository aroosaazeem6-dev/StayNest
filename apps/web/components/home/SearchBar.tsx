'use client';

import { useState } from 'react';
import Link from 'next/link';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

const fieldContainer = 'relative';

const staticLabel =
  'mb-1.5 block text-xs font-semibold uppercase tracking-[0.05em] text-sage-500';

export function SearchBar() {
  const [where, setWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  const searchParams = new URLSearchParams();
  if (where) searchParams.set('location', where);
  if (checkIn) searchParams.set('checkIn', checkIn);
  if (checkOut) searchParams.set('checkOut', checkOut);
  if (guests) searchParams.set('guests', guests);

  const searchHref = `/properties?${searchParams.toString()}`;

  return (
    <section className="container-section -mt-12 pb-2">
      <div className="mx-auto max-w-6xl rounded-2xl border border-sage-200/50 bg-white/90 p-4 shadow-[0_4px_24px_rgba(38,51,45,0.05)] backdrop-blur-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className={fieldContainer}>
            <label className={staticLabel}>Where are you going?</label>
            <input
              type="text"
              placeholder="City, area, or property"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              className="w-full rounded-lg border border-warm-300 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:outline-none focus:ring-0"
            />
          </div>

          <div className={fieldContainer}>
            <label className={staticLabel}>Check in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-lg border border-warm-300 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:ring-0"
            />
          </div>

          <div className={fieldContainer}>
            <label className={staticLabel}>Check out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-warm-300 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:ring-0"
            />
          </div>

          <div className={fieldContainer}>
            <label className={staticLabel}>Guests</label>
            <input
              type="number"
              min={1}
              placeholder="1+"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full rounded-lg border border-warm-300 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-end">
            <Link
              href={searchHref}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold"
            >
              <SearchIcon />
              Search Stays
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SearchBar;
