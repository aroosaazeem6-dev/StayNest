import { useState } from 'react';
import { PROPERTY_TYPES, SORT_OPTIONS, type FindPropertiesQuery } from '@/lib/property-service';

interface PropertyFiltersProps {
  query: FindPropertiesQuery;
  onChange: (next: FindPropertiesQuery) => void;
  onClear: () => void;
}

export function PropertyFilters({ query, onChange, onClear }: PropertyFiltersProps) {
  // Free-text and numeric fields are edited locally and only committed to the
  // URL/search when the user explicitly applies the form (Enter or button).
  // This prevents a fetch on every keystroke (e.g. typing "2" -> "20" -> "200").
  const [draft, setDraft] = useState<FindPropertiesQuery>(() => ({
    city: query.city ?? '',
    country: query.country ?? '',
    propertyType: query.propertyType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minGuests: query.minGuests,
    minBedrooms: query.minBedrooms,
    amenityIds: query.amenityIds,
    sort: query.sort,
  }));

  const applyFilters = () => {
    const num = (v: number | undefined): number | undefined =>
      v === undefined || Number.isNaN(v) ? undefined : v;
    const next: FindPropertiesQuery = {
      page: 1,
      city: (draft.city as string | undefined)?.trim() || undefined,
      country: (draft.country as string | undefined)?.trim() || undefined,
      propertyType: draft.propertyType,
      minPrice: num(draft.minPrice),
      maxPrice: num(draft.maxPrice),
      minGuests: num(draft.minGuests),
      minBedrooms: num(draft.minBedrooms),
      amenityIds: draft.amenityIds,
      sort: draft.sort,
    };
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
    }
  };

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
    <div className="rounded-2xl border border-[#DDE3DA] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#26332D]">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
          className="text-xs font-medium text-[#879B89] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Destination / City
          </label>
          <input
            id="city"
            type="text"
            value={(draft.city as string) ?? ''}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Aspen"
            className="w-full rounded-lg border border-[#DDE3DA] px-3 py-2 text-sm outline-none focus:border-[#879B89] focus:ring-1 focus:ring-[#879B89]"
          />
        </div>

        <div>
          <label htmlFor="country" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Country
          </label>
          <input
            id="country"
            type="text"
            value={(draft.country as string) ?? ''}
            onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g. USA"
            className="w-full rounded-lg border border-[#DDE3DA] px-3 py-2 text-sm outline-none focus:border-[#879B89] focus:ring-1 focus:ring-[#879B89]"
          />
        </div>

        <div>
          <label htmlFor="propertyType" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Property type
          </label>
          <select
            id="propertyType"
            value={draft.propertyType ?? ''}
            onChange={(e) => {
              const next = { ...draft, propertyType: e.target.value || undefined };
              setDraft(next);
              // Selects commit immediately for a responsive UI.
              onChange({ ...next, page: 1 });
            }}
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
              value={draft.minPrice ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onKeyDown={handleKeyDown}
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
              value={draft.maxPrice ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onKeyDown={handleKeyDown}
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
              value={draft.minGuests ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  minGuests: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onKeyDown={handleKeyDown}
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
              value={draft.minBedrooms ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  minBedrooms: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-xs font-medium text-[#6B756E]">
            Sort by
          </label>
          <select
            id="sort"
            value={draft.sort ?? ''}
            onChange={(e) => {
              const next = { ...draft, sort: (e.target.value || undefined) as FindPropertiesQuery['sort'] };
              setDraft(next);
              // Sort commits immediately for a responsive UI.
              onChange({ ...next, page: 1 });
            }}
            className="w-full rounded-lg border border-[#DDE3DA] px-3 py-2 text-sm outline-none focus:border-[#879B89] focus:ring-1 focus:ring-[#879B89]"
          >
            <option value="">Newest</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={applyFilters}
          className="btn-primary w-full"
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}

export default PropertyFilters;