import { Suspense } from 'react';
import { PropertyList } from '@/components/property/PropertyList';

export const metadata = {
  title: 'Properties — StayNest',
  description: 'Browse available vacation rentals on StayNest.',
};

interface PropertiesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;

  return (
    <div className="container-section py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#26332D]">
          Explore stays
        </h1>
        <p className="mt-1.5 text-sm text-[#6B756E]">
          Find your perfect vacation rental from our curated collection.
        </p>
      </div>

      <Suspense fallback={<PropertyListSkeleton />}>
        <PropertyList searchParams={params} />
      </Suspense>
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