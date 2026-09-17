'use client';

import { useEffect, useState } from 'react';
import {
  reviewService,
  type Review,
  type ListReviewsQuery,
  type ReviewListResponse,
} from '@/lib/review-service';

interface ReviewListProps {
  propertyId: string;
  initialPage?: number;
}

type ListStatus = 'loading' | 'success' | 'error' | 'empty';

/**
 * Public review list for a property.
 *
 * - Fetches reviews via the public GET endpoint (no access token required).
 * - Preserves the backend pagination metadata and lets the user page through.
 * - Renders a clear "No reviews yet" state when the property has none.
 * - The ReviewForm is intentionally NOT rendered here; it stays restricted to
 *   the dashboard booking flow (BookingRow) where eligibility is enforced.
 */
export function ReviewList({ propertyId, initialPage = 1 }: ReviewListProps) {
  const [page, setPage] = useState(initialPage);
  const [state, setState] = useState<{
    status: ListStatus;
    data: Review[] | null;
    error: string | null;
    meta: ReviewListResponse['meta'] | null;
  }>({ status: 'loading', data: null, error: null, meta: null });

  useEffect(() => {
    let mounted = true;
    setState((s) => ({ ...s, status: 'loading' }));
    const query: ListReviewsQuery = { page };
    reviewService
      .findAll(propertyId, query)
      .then((res) => {
        if (!mounted) return;
        if (res.data.length === 0) {
          setState({ status: 'empty', data: null, error: null, meta: res.meta });
        } else {
          setState({ status: 'success', data: res.data, error: null, meta: res.meta });
        }
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState({
          status: 'error',
          data: null,
          error: e?.status === 404 ? 'Property not found.' : e?.message || 'Unable to load reviews.',
          meta: null,
        });
      });
    return () => {
      mounted = false;
    };
  }, [propertyId, page]);

  if (state.status === 'loading') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{state.error}</p>
      </div>
    );
  }

  if (state.status === 'empty' || !state.data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-700">No reviews yet.</p>
        <p className="mt-1 text-sm text-gray-500">
          Be the first guest to review this stay after a completed booking.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {state.data.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {state.meta && state.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing {state.data.length} of {state.meta.total} reviews
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {state.meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= state.meta!.totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const reviewer = review.guest?.name ?? 'Guest';
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{reviewer}</p>
          <p className="mt-0.5 text-xs text-gray-500">{date}</p>
        </div>
        <span
          className="shrink-0 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {review.rating}/5
        </span>
      </div>
      <p className="mt-2 inline-block text-sm text-brand-600" aria-hidden>
        {stars}
      </p>
      {review.comment ? (
        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
      ) : (
        <p className="mt-2 text-sm italic text-gray-400">No written comment.</p>
      )}
    </div>
  );
}

export default ReviewList;