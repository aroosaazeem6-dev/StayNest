'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/property/PropertyCard';
import {
  propertyService,
  type PropertyListResponse,
} from '@/lib/property-service';

type Status = 'loading' | 'success' | 'error';

export function FeaturedStays() {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<PropertyListResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus('loading');

    propertyService
      .find({ limit: 6, sort: 'newest' })
      .then((result) => {
        if (mounted) {
          setData(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (mounted) {
          setErrorMsg('Unable to load properties right now.');
          setStatus('error');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const properties = data?.data ?? [];

  if (status === 'error') {
    return (
      <section className="container-section py-16">
        <div className="text-center">
          <p className="text-sm text-sage-500">{errorMsg}</p>
        </div>
      </section>
    );
  }

  if (properties.length === 0 && status === 'success') {
    return (
      <section className="container-section py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
            Find your next stay
          </h2>
          <p className="mt-4 text-sage-500">
            Your next stay is waiting. Start exploring beautiful properties and
            find somewhere that feels like home.
          </p>

          <div className="mt-8">
            <Link href="/properties" className="btn-primary">
              Explore all stays
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-section py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
          Find your next stay
        </h2>
        <p className="mt-3 text-sage-500">
          Handpicked stays from our curated collection.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedStays;
