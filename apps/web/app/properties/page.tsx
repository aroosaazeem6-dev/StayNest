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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Browse stays</h1>
        <p className="mt-2 text-gray-600">
          Find your perfect vacation rental from our curated collection.
        </p>
      </div>

      <Suspense fallback={<div className="h-[200px] animate-pulse rounded-xl bg-gray-100" />}>
        <PropertyList searchParams={params} />
      </Suspense>
    </div>
  );
}