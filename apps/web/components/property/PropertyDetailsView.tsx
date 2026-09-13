'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { propertyService, type Property } from '@/lib/property-service';
import { BookingCard } from './BookingCard';

interface PropertyDetailsViewProps {
  propertyId: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; property: Property }
  | { status: 'error'; message: string };

export function PropertyDetailsView({ propertyId }: PropertyDetailsViewProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;
    setState({ status: 'loading' });
    propertyService
      .findOne(propertyId)
      .then((property) => {
        if (mounted) setState({ status: 'success', property });
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (mounted) {
          if (e?.status === 404) {
            setState({ status: 'error', message: 'Property not found' });
          } else {
            setState({
              status: 'error',
              message: e?.message || 'Unable to load property details.',
            });
          }
        }
      });
    return () => {
      mounted = false;
    };
  }, [propertyId]);

  if (state.status === 'loading') {
    return <PropertyDetailsSkeleton />;
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-900">{state.message}</h2>
        <p className="mt-2 text-sm text-gray-500">
          The property you are looking for does not exist or is not available.
        </p>
        <Link href="/properties" className="btn-primary mt-4">
          Back to properties
        </Link>
      </div>
    );
  }

  const property = state.property;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/properties"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          &larr; Back to properties
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PropertyGallery property={property} />
        <div>
          <BookingCard
            property={property}
            onBookingCreated={(bookingId) =>
              router.push(`/bookings?booking=${encodeURIComponent(bookingId)}`)
            }
          />
        </div>
      </div>
    </div>
  );
}

function PropertyGallery({ property }: { property: Property }) {
  const images = property.images ?? [];
  const primary = images.find((img) => img.url) ?? images[0];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {primary?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={primary.url}
          alt={property.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center text-sm text-gray-400">
          StayNest
        </div>
      )}
    </div>
  );
}

function PropertyDetailsSkeleton() {
  return (
    <div>
      <div className="mb-6 h-4 w-28 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}