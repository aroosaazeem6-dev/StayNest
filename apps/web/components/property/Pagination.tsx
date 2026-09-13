import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  buildHref: (page: number) => string;
}

export function Pagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
  buildHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Property pagination" className="flex items-center justify-center gap-1">
      <Link
        href={buildHref(1)}
        aria-label="First page"
        className={`rounded-lg border px-3 py-2 text-sm transition ${
          page === 1
            ? 'pointer-events-none border-gray-200 text-gray-300'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        «
      </Link>
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-label="Previous page"
        className={`rounded-lg border px-3 py-2 text-sm transition ${
          !hasPrev
            ? 'pointer-events-none border-gray-200 text-gray-300'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        ‹
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            p === page
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-label="Next page"
        className={`rounded-lg border px-3 py-2 text-sm transition ${
          !hasNext
            ? 'pointer-events-none border-gray-200 text-gray-300'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        ›
      </Link>
      <Link
        href={buildHref(totalPages)}
        aria-label="Last page"
        className={`rounded-lg border px-3 py-2 text-sm transition ${
          page >= totalPages
            ? 'pointer-events-none border-gray-200 text-gray-300'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        »
      </Link>
    </nav>
  );
}

export default Pagination;