'use client';

import { useEffect, useState } from 'react';
import {
  PROPERTY_TYPES,
  type Property,
  type CreatePropertyRequest,
  type UpdatePropertyRequest,
} from '@/lib/property-service';

interface FieldErrors {
  title?: string;
  propertyType?: string;
  pricePerNight?: string;
  maxGuests?: string;
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  initial?: Property | null;
  onSubmit: (body: CreatePropertyRequest | UpdatePropertyRequest) => Promise<void>;
  submittingLabel: string;
  successLabel: string;
  onCancel?: () => void;
  submitError: string | null;
  submitSuccess: boolean;
}
export function PropertyForm({
  mode,
  initial,
  onSubmit,
  submittingLabel,
  successLabel,
  onCancel,
  submitError,
  submitSuccess,
}: PropertyFormProps) {
  const [draft, setDraft] = useState<CreatePropertyRequest | UpdatePropertyRequest>(
    initial
      ? {
          title: initial.title,
          description: initial.description ?? undefined,
          propertyType: initial.propertyType,
          address: initial.address ?? undefined,
          city: initial.city ?? undefined,
          country: initial.country ?? undefined,
          pricePerNight: initial.pricePerNight,
          maxGuests: initial.maxGuests,
          bedrooms: initial.bedrooms ?? undefined,
          bathrooms: initial.bathrooms ?? undefined,
        }
      : {
          title: '',
          propertyType: 'HOUSE',
          pricePerNight: 0,
          maxGuests: 1,
        },
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!initial) return;
    setDraft({
      title: initial.title,
      description: initial.description ?? undefined,
      propertyType: initial.propertyType,
      address: initial.address ?? undefined,
      city: initial.city ?? undefined,
      country: initial.country ?? undefined,
      pricePerNight: initial.pricePerNight,
      maxGuests: initial.maxGuests,
      bedrooms: initial.bedrooms ?? undefined,
      bathrooms: initial.bathrooms ?? undefined,
    });
    setErrors({});
  }, [initial]);
  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const d = draft as CreatePropertyRequest;
    if (!d.title || !d.title.trim()) {
      next.title = 'Title is required.';
    }
    if (!d.propertyType) {
      next.propertyType = 'Property type is required.';
    }
    if (d.pricePerNight === undefined || d.pricePerNight === null || Number.isNaN(Number(d.pricePerNight))) {
      next.pricePerNight = 'Price per night is required.';
    } else if (Number(d.pricePerNight) < 0) {
      next.pricePerNight = 'Price per night must be 0 or greater.';
    }
    if (d.maxGuests === undefined || d.maxGuests === null || Number.isNaN(Number(d.maxGuests))) {
      next.maxGuests = 'Max guests is required.';
    } else if (Number(d.maxGuests) < 1) {
      next.maxGuests = 'Max guests must be at least 1.';
    }
    return next;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setDraft((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      if (name === 'pricePerNight' || name === 'maxGuests' || name === 'bedrooms' || name === 'bathrooms') {
        next[name] = value === '' ? undefined : Number(value);
      } else {
        next[name] = value;
      }
      return next as CreatePropertyRequest | UpdatePropertyRequest;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    void onSubmit(draft);
  };

  const d = draft as CreatePropertyRequest;
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {mode === 'create' ? 'Create Property' : 'Edit Property'}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {mode === 'create'
            ? 'Add the details of your property.'
            : 'Update the details of your property.'}
        </p>
      </div>
      {submitSuccess && (
        <div
          role="status"
          className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {successLabel}
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          name="title"
          value={d.title ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={d.description ?? ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Property Type *
        </label>
        <select
          name="propertyType"
          value={d.propertyType ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.propertyType && (
          <p className="mt-1 text-xs text-red-600">{errors.propertyType}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          name="address"
          value={d.address ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            name="city"
            value={d.city ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            name="country"
            value={d.country ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price per Night *
          </label>
          <input
            name="pricePerNight"
            type="number"
            min="0"
            step="0.01"
            value={d.pricePerNight ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.pricePerNight && (
            <p className="mt-1 text-xs text-red-600">
              {errors.pricePerNight}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Guests *
          </label>
          <input
            name="maxGuests"
            type="number"
            min="1"
            value={d.maxGuests ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.maxGuests && (
            <p className="mt-1 text-xs text-red-600">{errors.maxGuests}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bedrooms
          </label>
          <input
            name="bedrooms"
            type="number"
            min="0"
            value={d.bedrooms ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bathrooms
          </label>
          <input
            name="bathrooms"
            type="number"
            min="0"
            step="0.5"
            value={d.bathrooms ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitSuccess}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitSuccess ? successLabel : submittingLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

