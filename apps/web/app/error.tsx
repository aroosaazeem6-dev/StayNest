'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="container-section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
      <p className="mt-2 max-w-md text-gray-600">
        We hit an unexpected error. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}