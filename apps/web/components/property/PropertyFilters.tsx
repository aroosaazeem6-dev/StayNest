import { PROPERTY_TYPES, SORT_OPTIONS, type FindPropertiesQuery } from '@/lib/property-service';

interface PropertyFiltersProps {
  query: FindPropertiesQuery;
  onChange: (next: FindPropertiesQuery) => void;
  onClear: () => void;
}

export function PropertyFilters({ query, onChange, onClear }: PropertyFiltersProps) {
  const hasFilters =
    !!query.city ||
    !!query.country ||
    !!query.propertyType ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.minGuests !== undefined ||
    query.minBedrooms !== undefined ||
    (query.amenityIds && query.amenityIds.length > 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
          className="text-xs font-medium text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-xs font-medium text-gray-500">
            Destination / City
          </label>
          <input
            id="city"
            type="text"
            value={query.city ?? ''}
            onChange={(e) => onChange({ ...query, city: e.target.value })}
            placeholder="e.g. Aspen"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="country" className="mb-1 block text-xs font-medium text-gray-500">
            Country
          </label>
          <input
            id="country"
            type="text"
            value={query.country ?? ''}
            onChange={(e) => onChange({ ...query, country: e.target.value })}
            placeholder="e.g. USA"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="propertyType" className="mb-1 block text-xs font-medium text-gray-500">
            Property type
          </label>
          <select
            id="propertyType"
            value={query.propertyType ?? ''}
            onChange={(e) =>
              onChange({ ...query, propertyType: e.target.value || undefined })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Any</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minPrice" className="mb-1 block text-xs font-medium text-gray-500">
              Min price
            </label>
            <input
              id="minPrice"
              type="number"
              min={0}
              value={query.minPrice ?? ''}
              onChange={(e) =>
                onChange({
                  ...query,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="maxPrice" className="mb-1 block text-xs font-medium text-gray-500">
              Max price
            </label>
            <input
              id="maxPrice"
              type="number"
              min={0}
              value={query.maxPrice ?? ''}
              onChange={(e) =>
                onChange({
                  ...query,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minGuests" className="mb-1 block text-xs font-medium text-gray-500">
              Min guests
            </label>
            <input
              id="minGuests"
              type="number"
              min={1}
              value={query.minGuests ?? ''}
              onChange={(e) =>
                onChange({
                  ...query,
                  minGuests: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="minBedrooms" className="mb-1 block text-xs font-medium text-gray-500">
              Min bedrooms
            </label>
            <input
              id="minBedrooms"
              type="number"
              min={0}
              value={query.minBedrooms ?? ''}
              onChange={(e) =>
                onChange({
                  ...query,
                  minBedrooms: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-xs font-medium text-gray-500">
            Sort by
          </label>
          <select
            id="sort"
            value={query.sort ?? ''}
            onChange={(e) =>
              onChange({ ...query, sort: (e.target.value || undefined) as FindPropertiesQuery['sort'] })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Newest</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default PropertyFilters;