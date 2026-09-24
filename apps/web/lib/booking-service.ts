import { apiClient } from './api-client';

/** Mirrors BookingPropertyDto from the backend. */
export interface BookingProperty {
  id: string;
  title: string;
  propertyType: string;
  city: string | null;
  country: string | null;
  pricePerNight: number;
  hostId: string;
}

/** Mirrors BookingResponseDto from the backend. */
export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  property: BookingProperty;
}

/** Mirrors CreateBookingDto from the backend. */
export interface CreateBookingRequest {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

/** Mirrors CheckAvailabilityDto from the backend. */
export interface CheckAvailabilityRequest {
  checkIn: string;
  checkOut: string;
}

/** Response of POST /api/v1/properties/:propertyId/availability/check. */
export interface AvailabilityResponse {
  available: boolean;
}

/** Mirrors PaginationMetaDto from the backend (bookings list). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Mirrors BookingListResponseDto from the backend. */
export interface BookingListResponse {
  data: Booking[];
  meta: PaginationMeta;
}

/** Mirrors HostBookingPropertyDto from the backend. */
export interface HostBookingProperty {
  id: string;
  title: string;
  propertyType: string;
  city: string | null;
  country: string | null;
  pricePerNight: number;
  coverImage: string | null;
}

/** Mirrors HostBookingGuestDto from the backend. */
export interface HostBookingGuest {
  id: string;
  name: string;
  email: string;
}

/** Mirrors HostBookingResponseDto from the backend. */
export interface HostBooking {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  property: HostBookingProperty;
  guest: HostBookingGuest;
}

/** Mirrors HostBookingListResponseDto from the backend. */
export interface HostBookingListResponse {
  data: HostBooking[];
  meta: PaginationMeta;
}

/**
 * Thin service layer over the booking API.
 *
 * Endpoints (all under /api/v1):
 *   POST /bookings                       -> BookingResponseDto (201, 409 conflict, 404, 403)
 *   GET  /bookings/my                    -> BookingListResponseDto
 *   GET  /bookings/:id                   -> BookingResponseDto
 *   PATCH /bookings/:id/cancel           -> BookingResponseDto
 */
export const bookingService = {
  async create(
    body: CreateBookingRequest,
    accessToken: string,
  ): Promise<Booking> {
    return apiClient.request<Booking>(
      '/bookings',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      accessToken,
    );
  },

  async findHostRequests(
    accessToken: string,
    page = 1,
    limit = 10,
  ): Promise<HostBookingListResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    return apiClient.request<HostBookingListResponse>(
      `/bookings/host/requests?${params.toString()}`,
      {},
      accessToken,
    );
  },

  async hostAccept(
    id: string,
    accessToken: string,
  ): Promise<HostBooking> {
    return apiClient.request<HostBooking>(
      `/bookings/${id}/host-accept`,
      { method: 'PATCH' },
      accessToken,
    );
  },

  async hostDecline(
    id: string,
    accessToken: string,
  ): Promise<HostBooking> {
    return apiClient.request<HostBooking>(
      `/bookings/${id}/host-decline`,
      { method: 'PATCH' },
      accessToken,
    );
  },

  /**
   * Check whether a property is available for a date range.
   * Endpoint: POST /api/v1/properties/:propertyId/availability/check (public)
   * Body: { checkIn, checkOut }  ->  { available: boolean }
   */
  async checkAvailability(
    propertyId: string,
    body: CheckAvailabilityRequest,
  ): Promise<AvailabilityResponse> {
    return apiClient.request<AvailabilityResponse>(
      `/properties/${propertyId}/availability/check`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      null,
    );
  },

  /**
   * List the authenticated guest's bookings.
   * Endpoint: GET /api/v1/bookings/my?page=&limit= (GUEST only)
   */
  async findMyBookings(
    accessToken: string,
    page = 1,
    limit = 10,
  ): Promise<BookingListResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    return apiClient.request<BookingListResponse>(
      `/bookings/my?${params.toString()}`,
      {},
      accessToken,
    );
  },

  /**
   * Fetch a single booking by ID.
   * Endpoint: GET /api/v1/bookings/:id (guest, host, or admin)
   */
  async findOne(id: string, accessToken: string): Promise<Booking> {
    return apiClient.request<Booking>(`/bookings/${id}`, {}, accessToken);
  },

  /**
   * Cancel a booking.
   * Endpoint: PATCH /api/v1/bookings/:id/cancel (guest, host, or admin)
   * Backend rejects CANCELLED and COMPLETED bookings with 400.
   */
  async cancel(id: string, accessToken: string): Promise<Booking> {
    return apiClient.request<Booking>(
      `/bookings/${id}/cancel`,
      {
        method: 'PATCH',
      },
      accessToken,
    );
  },
};

export default bookingService;