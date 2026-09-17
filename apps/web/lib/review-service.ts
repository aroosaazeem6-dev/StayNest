import { apiClient } from './api-client';

/** Mirrors ReviewPropertyDto from the backend. */
export interface ReviewProperty {
  id: string;
  title: string;
  propertyType: string;
  city: string | null;
  country: string | null;
}

/** Mirrors ReviewGuestDto from the backend. */
export interface ReviewGuest {
  id: string;
  name: string;
}

/** Mirrors ReviewResponseDto from the backend. */
export interface Review {
  id: string;
  propertyId: string;
  guestId: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  property: ReviewProperty;
  guest: ReviewGuest;
}

/** Mirrors CreateReviewDto from the backend. */
export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
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

/** Mirrors ReviewListResponseDto from the backend. */
export interface ReviewListResponse {
  data: Review[];
  meta: PaginationMeta;
}

/**
 * Query shape for listing reviews (mirrors ListReviewsQueryDto).
 * All fields are optional; the backend defaults to page=1, limit=10.
 */
export interface ListReviewsQuery {
  page?: number;
  limit?: number;
  minRating?: number;
}

/**
 * Thin service layer over the review API.
 *
 * Endpoints (all under /api/v1):
 *   POST /properties/:propertyId/reviews  -> ReviewResponseDto (GUEST, COMPLETED only)
 *   GET  /properties/:propertyId/reviews  -> ReviewListResponseDto (public)
 *   GET  /reviews/:id                     -> ReviewResponseDto
 */
export const reviewService = {
  async create(
    propertyId: string,
    body: CreateReviewRequest,
    accessToken: string,
  ): Promise<Review> {
    return apiClient.request<Review>(
      `/properties/${propertyId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      accessToken,
    );
  },

  /**
   * List reviews for a property (public, paginated).
   * Endpoint: GET /api/v1/properties/:propertyId/reviews?page=&limit=&minRating=
   * Response: ReviewListResponseDto
   */
  async findAll(
    propertyId: string,
    query: ListReviewsQuery = {},
  ): Promise<ReviewListResponse> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.minRating !== undefined)
      params.set('minRating', String(query.minRating));

    const qs = params.toString();
    const path = qs
      ? `/properties/${propertyId}/reviews?${qs}`
      : `/properties/${propertyId}/reviews`;

    return apiClient.request<ReviewListResponse>(path, {}, null);
  },
};

export default reviewService;