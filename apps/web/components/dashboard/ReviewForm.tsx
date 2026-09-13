'use client';

import { useState } from 'react';
import { reviewService } from '@/lib/review-service';
import { type Booking } from '@/lib/booking-service';

interface ReviewFormProps {
  booking: Booking;
  accessToken: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ booking, accessToken, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-sm text-green-700">
        Thank you! Your review has been submitted.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError('Please select a rating from 1 to 5.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.create(
        booking.property.id,
        {
          bookingId: booking.id,
          rating,
          comment: comment.trim() || undefined,
        },
        accessToken,
      );
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string } | undefined;
      if (e?.status === 400) {
        const msg = e?.message || '';
        if (/duplicate|already reviewed|already/i.test(msg)) {
          setError('You have already reviewed this stay.');
        } else {
          setError(msg || 'Only completed bookings can be reviewed.');
        }
      } else if (e?.status === 403) {
        setError('You can only review your own bookings.');
      } else if (e?.status === 404) {
        setError('Property or booking not found.');
      } else {
        setError(e?.message || 'Unable to submit review.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <h4 className="text-sm font-semibold text-gray-900">Leave a review</h4>
      <form onSubmit={handleSubmit} className="mt-2 space-y-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Rating</label>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n <= rating}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="text-2xl text-gray-300 transition hover:text-brand-500 focus:outline-none"
                disabled={submitting}
              >
                {n <= (hover || rating) ? '★' : '☆'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor={`comment-${booking.id}`} className="mb-1 block text-xs font-medium text-gray-500">
            Comment (optional)
          </label>
          <textarea
            id={`comment-${booking.id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            disabled={submitting}
          />
        </div>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <button type="submit" className="btn-primary !py-2 !px-4 text-sm" disabled={submitting || rating < 1}>
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </form>
    </div>
  );
}