import { apiClient } from './api-client';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminDashboardOverview {
  users: number;
  properties: number;
  propertyStatuses: { draft: number; active: number; archived: number };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    hostAccepted: number;
    hostDeclined: number;
  };
  payments: {
    total: number;
    pending: number;
    succeeded: number;
    failed: number;
    refunded: number;
  };
  reviews: number;
  favorites: number;
  recentActivity: {
    recentBookings: {
      id: string;
      propertyId: string;
      guestId: string;
      status: string;
      checkIn: string;
      checkOut: string;
      totalAmount: number;
      createdAt: string;
    }[];
    recentPayments: {
      id: string;
      bookingId: string;
      provider: string | null;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
    }[];
    recentReviews: {
      id: string;
      propertyId: string;
      guestId: string;
      rating: number;
      createdAt: string;
    }[];
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  data: AdminUser[];
  meta: PaginationMeta;
}

export interface AdminProperty {
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
  host: { id: string; name: string; email: string } | null;
}

export interface AdminPropertyListResponse {
  data: AdminProperty[];
  meta: PaginationMeta;
}

export interface AdminBooking {
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
  property: {
    id: string;
    title: string;
    propertyType: string;
    city: string | null;
    country: string | null;
    pricePerNight: number;
    hostId: string;
  };
  guest: { id: string; name: string };
}

export interface AdminBookingListResponse {
  data: AdminBooking[];
  meta: PaginationMeta;
}

export interface AdminPayment {
  id: string;
  bookingId: string;
  provider: string | null;
  providerReference: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    guestId: string;
    propertyId: string;
    status: string;
  };
}

export interface AdminPaymentListResponse {
  data: AdminPayment[];
  meta: PaginationMeta;
}

export const adminService = {
  async getDashboardOverview(accessToken: string): Promise<AdminDashboardOverview> {
    return apiClient.request<AdminDashboardOverview>('/admin/dashboard/overview', {}, accessToken);
  },

  async listUsers(
    accessToken: string,
    query: { page?: number; limit?: number; role?: string; search?: string },
  ): Promise<AdminUserListResponse> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.role) params.set('role', query.role);
    if (query.search) params.set('search', query.search);
    const qs = params.toString();
    return apiClient.request<AdminUserListResponse>(
      `/admin/users${qs ? `?${qs}` : ''}`,
      {},
      accessToken,
    );
  },

  async getUser(accessToken: string, id: string): Promise<AdminUser> {
    return apiClient.request<AdminUser>(`/admin/users/${id}`, {}, accessToken);
  },

  async updateUserRole(
    accessToken: string,
    id: string,
    role: string,
  ): Promise<AdminUser> {
    return apiClient.request<AdminUser>(
      `/admin/users/${id}/role`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
      accessToken,
    );
  },

  async listProperties(
    accessToken: string,
    query: { page?: number; limit?: number; status?: string; search?: string },
  ): Promise<AdminPropertyListResponse> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    const qs = params.toString();
    return apiClient.request<AdminPropertyListResponse>(
      `/admin/properties${qs ? `?${qs}` : ''}`,
      {},
      accessToken,
    );
  },

  async getProperty(accessToken: string, id: string): Promise<AdminProperty> {
    return apiClient.request<AdminProperty>(`/admin/properties/${id}`, {}, accessToken);
  },

  async updatePropertyStatus(
    accessToken: string,
    id: string,
    status: string,
  ): Promise<AdminProperty> {
    return apiClient.request<AdminProperty>(
      `/admin/properties/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      accessToken,
    );
  },

  async listBookings(
    accessToken: string,
    query: { page?: number; limit?: number; status?: string },
  ): Promise<AdminBookingListResponse> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.status) params.set('status', query.status);
    const qs = params.toString();
    return apiClient.request<AdminBookingListResponse>(
      `/admin/bookings${qs ? `?${qs}` : ''}`,
      {},
      accessToken,
    );
  },

  async getBooking(accessToken: string, id: string): Promise<AdminBooking> {
    return apiClient.request<AdminBooking>(`/admin/bookings/${id}`, {}, accessToken);
  },

  async updateBookingStatus(
    accessToken: string,
    id: string,
    status: string,
  ): Promise<AdminBooking> {
    return apiClient.request<AdminBooking>(
      `/admin/bookings/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      accessToken,
    );
  },

  async listPayments(
    accessToken: string,
    query: { page?: number; limit?: number; status?: string },
  ): Promise<AdminPaymentListResponse> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.status) params.set('status', query.status);
    const qs = params.toString();
    return apiClient.request<AdminPaymentListResponse>(
      `/admin/payments${qs ? `?${qs}` : ''}`,
      {},
      accessToken,
    );
  },

  async getPayment(accessToken: string, id: string): Promise<AdminPayment> {
    return apiClient.request<AdminPayment>(`/admin/payments/${id}`, {}, accessToken);
  },

  async updatePaymentStatus(
    accessToken: string,
    id: string,
    status: string,
  ): Promise<AdminPayment> {
    return apiClient.request<AdminPayment>(
      `/admin/payments/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      accessToken,
    );
  },
};

export default adminService;