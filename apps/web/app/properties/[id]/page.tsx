import { Suspense } from 'react';

export const metadata = {
  title: 'Property — StayNest',
  description: 'View property details and book your stay on StayNest.',
};

interface PropertyDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  return (
    <div className="container-section py-8">
      <Suspense fallback={<PropertyDetailsSkeleton />}>
        <PropertyDetails params={params} />
      </Suspense>
    </div>
  );
}

// Server component: resolves the route param and fetches the property.
async function PropertyDetails({ params }: PropertyDetailsPageProps) {
  const { id } = await params;

  // Lazy import keeps the client booking card out of the server bundle.
  const { PropertyDetailsView } = await import(
    '@/components/property/PropertyDetailsView'
  );

  return <PropertyDetailsView propertyId={id} />;
}

function PropertyDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-gray-200" />
      <div className="space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}