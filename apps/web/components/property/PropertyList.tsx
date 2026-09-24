'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PropertyCard } from './PropertyCard';
import { Pagination } from './Pagination';
import { PropertyFilters } from './PropertyFilters';
import { propertyService, type FindPropertiesQuery, type PropertyListResponse } from '@/lib/property-service';

interface PropertyListProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function parseQuery(searchParams: Record<string, string | string[] | undefined>): FindPropertiesQuery {
  const num = (v: string | string[] | undefined): number | undefined => {
    if (typeof v !== 'string') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const amenityIdsRaw = searchParams.amenityIds;
  const amenityIds = Array.isArray(amenityIdsRaw)
    ? amenityIdsRaw
    : typeof amenityIdsRaw === 'string'
      ? [amenityIdsRaw]
      : undefined;

  return {
    page: num(searchParams.page),
    limit: num(searchParams.limit),
    city: typeof searchParams.city === 'string' ? searchParams.city : undefined,
    country: typeof searchParams.country === 'string' ? searchParams.country : undefined,
    propertyType: typeof searchParams.propertyType === 'string' ? searchParams.propertyType : undefined,
    minPrice: num(searchParams.minPrice),
    maxPrice: num(searchParams.maxPrice),
    minGuests: num(searchParams.minGuests),
    minBedrooms: num(searchParams.minBedrooms),
    amenityIds,
    sort: typeof searchParams.sort === 'string'
      ? (searchParams.sort as FindPropertiesQuery['sort'])
      : undefined,
  };
}

function buildHref(
  query: FindPropertiesQuery,
  overrides: Partial<FindPropertiesQuery> = {},
): string {
  const params = new URLSearchParams();
  const merged = { ...query, ...overrides };
  if (merged.page) params.set('page', String(merged.page));
  if (merged.limit) params.set('limit', String(merged.limit));
  if (merged.city) params.set('city', merged.city);
  if (merged.country) params.set('country', merged.country);
  if (merged.propertyType) params.set('propertyType', merged.propertyType);
  if (merged.minPrice !== undefined) params.set('minPrice', String(merged.minPrice));
  if (merged.maxPrice !== undefined) params.set('maxPrice', String(merged.maxPrice));
  if (merged.minGuests !== undefined) params.set('minGuests', String(merged.minGuests));
  if (merged.minBedrooms !== undefined) params.set('minBedrooms', String(merged.minBedrooms));
  if (merged.amenityIds && merged.amenityIds.length > 0) {
    for (const id of merged.amenityIds) params.append('amenityIds', id);
  }
  if (merged.sort) params.set('sort', merged.sort);
  const qs = params.toString();
  return qs ? `/properties?${qs}` : '/properties';
}

export function PropertyList({ searchParams }: PropertyListProps) {
  const router = useRouter();
  const query = useMemo(() => parseQuery(searchParams), [searchParams]);

  const [state, setState] = useState<{
    status: 'loading' | 'success' | 'error';
    data: PropertyListResponse | null;
    error: Error | null;
  }>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let mounted = true;
    setState((s) => ({ ...s, status: 'loading' }));
    propertyService
      .find(query)
      .then((data) => {
        if (mounted) setState({ status: 'success', data, error: null });
      })
      .catch((err: unknown) => {
        if (mounted) setState({ status: 'error', data: null, error: err as Error });
      });
    return () => {
      mounted = false;
    };
  }, [query]);

  const { status, data, error } = state;
  const properties = data?.data ?? [];
  const meta = data?.meta;

  if (status === 'loading') {
    return <PropertyListSkeleton />;
  }

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">
          {error?.message || 'Unable to load properties.'}
        </p>
        <button
          onClick={() => router.refresh()}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DDE3DA] bg-white p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1E7] text-[#879B89]">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.6">
            <path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 9v11h14V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-4 text-base font-medium text-[#26332D]">No stays found</p>
        <p className="mt-1 text-sm text-[#6B756E]">
          Try adjusting your filters or clearing them to see all properties.
        </p>
        <Link href="/properties" className="btn-primary mt-5">
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <PropertyFilters
        query={query}
        onChange={(next) => router.push(buildHref(next))}
        onClear={() => router.push('/properties')}
      />

      <div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasNext={meta.hasNext}
              hasPrev={meta.hasPrev}
              buildHref={(p) => buildHref(query, { page: p })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div className="h-[200px] animate-pulse rounded-2xl border border-[#DDE3DA] bg-white" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white">
            <div className="aspect-[4/3] animate-pulse bg-[#E8E6DF]" />
            <div className="p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#E8E6DF]" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-[#E8E6DF]" />
              <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-[#E8E6DF]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}