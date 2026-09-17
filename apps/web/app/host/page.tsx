'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { propertyService, type Property, type CreatePropertyRequest, type UpdatePropertyRequest } from '@/lib/property-service';
import { PropertyForm } from '@/components/property/PropertyForm';
import { PropertyCard } from '@/components/property/PropertyCard';

export default function HostPage() {
  const { tokens, isLoading } = useAuth();
  const accessToken = tokens?.accessToken ?? null;
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchProperties = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await propertyService.findMine(accessToken);
      setProperties(data);
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setLoadError(e?.status === 401 ? "Your session has expired. Please log in again." : e?.message || "Unable to load your properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    void fetchProperties();
  }, [accessToken, isLoading]);

  const handleCreate = async (body: CreatePropertyRequest) => {
    if (!accessToken) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await propertyService.create(body, accessToken);
      setFormOpen(false);
      setEditing(null);
      setActionSuccess("Property created successfully.");
      await fetchProperties();
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setActionError(e?.message || "Unable to create property.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, body: UpdatePropertyRequest) => {
    if (!accessToken) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await propertyService.update(id, body, accessToken);
      setEditing(null);
      setActionSuccess("Property updated successfully.");
      await fetchProperties();
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setActionError(e?.message || "Unable to update property.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm("Archive this property? It will no longer be visible to guests.")) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await propertyService.remove(id, accessToken);
      setActionSuccess("Property archived successfully.");
      await fetchProperties();
    } catch (err) {
      const e = err as { status?: number; message?: string } | undefined;
      setActionError(e?.message || "Unable to archive property.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.HOST]}>
      <div className="container-section py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hosting</h1>
            <p className="mt-2 text-gray-600">Manage your listings and hosting activity.</p>
          </div>
          <button
            type="button"
            onClick={() => { setFormOpen(true); setEditing(null); setActionError(null); setActionSuccess(null); }}
            className="btn-primary !py-2 !px-4"
          >
            Add Property
          </button>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div
            role="status"
            className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {actionSuccess}
          </div>
        )}

        {formOpen && !editing && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Property
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="btn-secondary !py-2 !px-4"
              >
                Cancel
              </button>
            </div>

            <PropertyForm
              mode="create"
              onSubmit={async (body) => {
                await handleCreate(body as CreatePropertyRequest);
              }}
              submittingLabel={submitting ? 'Creating...' : 'Create Property'}
              successLabel="Property created successfully."
              onCancel={() => setFormOpen(false)}
              submitError={actionError}
              submitSuccess={false}
            />
          </div>
        )}

        {editing && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Property
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-secondary !py-2 !px-4"
              >
                Cancel
              </button>
            </div>

            <PropertyForm
              mode="edit"
              initial={editing}
              onSubmit={async (body) => {
                await handleUpdate(
                  editing.id,
                  body as UpdatePropertyRequest,
                );
              }}
              submittingLabel={submitting ? 'Updating...' : 'Update Property'}
              successLabel="Property updated successfully."
              onCancel={() => setEditing(null)}
              submitError={actionError}
              submitSuccess={false}
            />
          </div>
        )}

        {isLoading || loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            Loading your properties...
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchProperties()}
              className="btn-secondary mt-4 !py-2 !px-4"
            >
              Try Again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No properties yet
            </h2>
            <p className="mt-2 text-gray-600">
              Add your first apartment or property to start hosting.
            </p>
            <button
              type="button"
              onClick={() => {
                setFormOpen(true);
                setEditing(null);
                setActionError(null);
                setActionSuccess(null);
              }}
              className="btn-primary mt-5 !py-2 !px-4"
            >
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard property={property} />

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(property);
                      setFormOpen(false);
                      setActionError(null);
                      setActionSuccess(null);
                    }}
                    disabled={submitting}
                    className="btn-secondary flex-1 !py-2 !px-3"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(property.id)}
                    disabled={submitting}
                    className="flex-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


