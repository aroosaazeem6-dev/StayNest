import { apiClient } from './api-client';

/** Mirrors PropertyResponseDto from the backend. */
export interface PropertyImage {
  id: string;
  url: string | null;
  objectKey: string;
  createdAt: string;
}

/** Mirrors AmenityDto from the backend. */
export interface Amenity {
  id: string;
  name: string;
}

/** Mirrors PropertyResponseDto from the backend. */
export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  propertyType: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  amenities: Amenity[];
}

/** Mirrors PaginationMetaDto from the backend. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PropertyListResponse {
  data: Property[];
  meta: PaginationMeta;
}

/** Mirrors FindPropertiesQueryDto from the backend. */
export interface FindPropertiesQuery {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  minBedrooms?: number;
  amenityIds?: string[];
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

/** Backend-supported sort options. */
export const SORT_OPTIONS: { value: FindPropertiesQuery['sort']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

/** Backend-supported property types. */
export const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'VILLA',
  'COTTAGE',
  'BUNGALOW',
  'TREEHOUSE',
  'CASTLE',
  'STUDIO',
  'OTHER',
] as const;

/**
 * Thin service layer over the public property API.
 *
 * Endpoint: GET /api/v1/properties (public, paginated, filterable)
 * Response: { data: PropertyResponseDto[], meta: PaginationMetaDto }
 */
export const propertyService = {
  async find(query: FindPropertiesQuery = {}): Promise<PropertyListResponse> {
    const params = new URLSearchParams();

    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.city) params.set('city', query.city);
    if (query.country) params.set('country', query.country);
    if (query.propertyType) params.set('propertyType', query.propertyType);
    if (query.minPrice !== undefined && query.minPrice !== null)
      params.set('minPrice', String(query.minPrice));
    if (query.maxPrice !== undefined && query.maxPrice !== null)
      params.set('maxPrice', String(query.maxPrice));
    if (query.minGuests !== undefined && query.minGuests !== null)
      params.set('minGuests', String(query.minGuests));
    if (query.minBedrooms !== undefined && query.minBedrooms !== null)
      params.set('minBedrooms', String(query.minBedrooms));
    if (query.amenityIds && query.amenityIds.length > 0) {
      for (const id of query.amenityIds) {
        params.append('amenityIds', id);
      }
    }
    if (query.sort) params.set('sort', query.sort);

    const qs = params.toString();
    const path = qs ? `/properties?${qs}` : '/properties';

    return apiClient.request<PropertyListResponse>(path, {}, null);
  },

  /**
   * Fetch a single property by ID (public).
   * Endpoint: GET /api/v1/properties/:id
   * Returns PropertyResponseDto (404 if not found or not ACTIVE for anonymous).
   */
  async findOne(id: string): Promise<Property> {
    return apiClient.request<Property>(`/properties/${id}`, {}, null);
  },

  /**
   * List properties owned by the authenticated host.
   * Endpoint: GET /api/v1/properties/mine (HOST/ADMIN only)
   * Returns PropertyResponseDto[] (no pagination envelope).
   */
  async findMine(accessToken: string): Promise<Property[]> {
    return apiClient.request<Property[]>(
      '/properties/mine',
      {},
      accessToken,
    );
  },

  /**
   * Create a property as the authenticated host.
   * Endpoint: POST /api/v1/properties (HOST/ADMIN only)
   * Returns PropertyResponseDto. New properties start as DRAFT.
   */
  async create(
    body: CreatePropertyRequest,
    accessToken: string,
  ): Promise<Property> {
    return apiClient.request<Property>(
      '/properties',
      { method: 'POST', body: JSON.stringify(body) },
      accessToken,
    );
  },

  /**
   * Update a property owned by the authenticated host.
   * Endpoint: PATCH /api/v1/properties/:id (HOST owner or ADMIN only)
   * Returns PropertyResponseDto.
   */
  async update(
    id: string,
    body: UpdatePropertyRequest,
    accessToken: string,
  ): Promise<Property> {
    return apiClient.request<Property>(
      `/properties/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
      accessToken,
    );
  },

  /**
   * Archive a property owned by the authenticated host.
   * Endpoint: DELETE /api/v1/properties/:id (HOST owner or ADMIN only)
   * Archives (does not hard-delete) the property.
   */
  async remove(id: string, accessToken: string): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/properties/${id}`,
      { method: 'DELETE' },
      accessToken,
    );
  },
};

/** Mirrors CreatePropertyDto from the backend. */
export interface CreatePropertyRequest {
  title: string;
  description?: string;
  propertyType: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
  maxGuests: number;
  bedrooms?: number;
  bathrooms?: number;
  amenityIds?: string[];
  imageUrls?: string[];
}

/** Mirrors UpdatePropertyDto from the backend (all fields optional). */
export interface UpdatePropertyRequest {
  title?: string;
  description?: string | null;
  propertyType?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerNight?: number;
  maxGuests?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  status?: string;
  amenityIds?: string[];
  imageUrls?: string[];
}

export default propertyService;