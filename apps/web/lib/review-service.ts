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
};

export default reviewService;