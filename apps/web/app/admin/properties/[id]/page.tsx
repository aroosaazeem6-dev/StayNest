'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { adminService } from '@/lib/admin-service';

type AdminProperty = Awaited<ReturnType<typeof adminService.getProperty>>;

export default function AdminPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    params.then((p) => {
      if (mounted) setId(p.id);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  if (!id) return null;

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="container-section py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Property</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <AdminSidebar />
          <PropertyDetail id={id} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function PropertyDetail({ id }: { id: string }) {
  const router = useRouter();
  const { tokens } = useAuth();
  const [property, setProperty] = useState<AdminProperty | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    let mounted = true;
    setState('loading');
    adminService
      .getProperty(tokens.accessToken, id)
      .then((p) => {
        if (!mounted) return;
        setProperty(p);
        setState('success');
      })
      .catch((err: unknown) => {
        const e = err as { status?: number; message?: string } | undefined;
        if (!mounted) return;
        setState('error');
        setError(e?.status === 404 ? 'Property not found.' : e?.message || 'Unable to load property.');
      });
    return () => {
      mounted = false;
    };
  }, [id, tokens]);

  if (state === 'loading' || !property) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={() => router.refresh()} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-gray-500">ID</dt>
          <dd className="mt-1 font-mono text-sm text-gray-900">{property.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Title</dt>
          <dd className="mt-1 text-sm text-gray-900">{property.title}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Type</dt>
          <dd className="mt-1 text-sm text-gray-900">{property.propertyType}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Status</dt>
          <dd className="mt-1 text-sm text-gray-900">{property.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">City</dt>
          <dd className="mt-1 text-sm text-gray-900">{property.city ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Country</dt>
          <dd className="mt-1 text-sm text-gray-900">{property.country ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Price / night</dt>
          <dd className="mt-1 text-sm text-gray-900">${property.pricePerNight}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Max guests</dt>
          <dd className="mt-1 text-sm text-gray-900">{property.maxGuests}</dd>
        </div>
        {property.bedrooms !== null && (
          <div>
            <dt className="text-xs font-medium text-gray-500">Bedrooms</dt>
            <dd className="mt-1 text-sm text-gray-900">{property.bedrooms}</dd>
          </div>
        )}
        {property.bathrooms !== null && (
          <div>
            <dt className="text-xs font-medium text-gray-500">Bathrooms</dt>
            <dd className="mt-1 text-sm text-gray-900">{property.bathrooms}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium text-gray-500">Host</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {property.host ? property.host.name : property.hostId}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Created</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(property.createdAt).toLocaleString()}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex gap-3">
        <Link href="/admin/properties" className="btn-secondary">
          Back to properties
        </Link>
      </div>
    </div>
  );
}