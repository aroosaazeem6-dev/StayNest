import { apiClient } from './api-client';

/** Mirrors FavoritePropertyDto from the backend. */
export interface FavoriteProperty {
  id: string;
  title: string;
  propertyType: string;
  city: string | null;
  country: string | null;
}

/** Mirrors FavoriteResponseDto from the backend. */
export interface Favorite {
  id: string;
  propertyId: string;
  guestId: string;
  createdAt: string;
  property: FavoriteProperty;
}

/** Mirrors FavoriteListResponseDto from the backend. */
export interface FavoriteListResponse {
  data: Favorite[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Thin service layer over the favorite API.
 *
 * Endpoints (all under /api/v1):
 *   GET    /favorites                            -> FavoriteListResponseDto (GUEST)
 *   POST   /properties/:propertyId/favorite       -> FavoriteResponseDto (GUEST)
 *   DELETE /properties/:propertyId/favorite       -> { message: string } (GUEST)
 *   GET    /properties/:propertyId/favorite       -> { favorited: boolean } (GUEST)
 */
export const favoriteService = {
  async findMine(accessToken: string, page = 1, limit = 10): Promise<FavoriteListResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    return apiClient.request<FavoriteListResponse>(
      `/favorites?${params.toString()}`,
      {},
      accessToken,
    );
  },

  async remove(propertyId: string, accessToken: string): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/properties/${propertyId}/favorite`,
      { method: 'DELETE' },
      accessToken,
    );
  },
};

export default favoriteService;