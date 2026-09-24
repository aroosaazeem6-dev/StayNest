'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { propertyService, type Property, type CreatePropertyRequest, type UpdatePropertyRequest } from '@/lib/property-service';
import { PropertyForm } from '@/components/property/PropertyForm';
import { PropertyCard } from '@/components/property/PropertyCard';

export default function HostPage() {
  const { tokens, isLoading, user } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  // Host route access: legacy role=HOST OR (role=GUEST && isHost=true).
  // A pure guest (isHost=false) is redirected away — backend authorization
  // remains the enforcement point for property actions.
  const hasHostingCapability = Boolean(
    user && (user.role === UserRole.HOST || (user.role === UserRole.GUEST && user.isHost === true)),
  );
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
    <ProtectedRoute allowedRoles={[UserRole.HOST, UserRole.GUEST]}>
      {!hasHostingCapability ? (
        <div className="container-section py-16">
          <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-xl font-semibold text-amber-900">Hosting not enabled</h2>
            <p className="mt-2 text-sm text-amber-800">
              Your account does not have hosting capability yet. Return to your
              dashboard to become a host.
            </p>
          </div>
        </div>
      ) : (
        <div className="container-section py-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[#26332D]">
                Hosting
              </h1>
              <p className="mt-1.5 text-sm text-[#6B756E]">
                Manage your listings and hosting activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setFormOpen(true); setEditing(null); setActionError(null); setActionSuccess(null); }}
              className="btn-primary !py-2 !px-4"
            >
              + Add Property
            </button>
          </div>

          {actionError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionSuccess}
            </div>
          )}

          {formOpen && !editing && (
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#26332D]">
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
                <h2 className="text-xl font-semibold text-[#26332D]">
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
            <div className="rounded-2xl border border-[#DDE3DA] bg-white p-8 text-center text-[#6B756E]">
              Loading your properties...
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
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
            <div className="rounded-2xl border border-dashed border-[#DDE3DA] bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1E7] text-[#879B89]">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.6">
                  <path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 9v11h14V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[#26332D]">
                No properties yet
              </h2>
              <p className="mt-1.5 text-sm text-[#6B756E]">
                Add your first apartment or property to start hosting on StayNest.
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
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}


