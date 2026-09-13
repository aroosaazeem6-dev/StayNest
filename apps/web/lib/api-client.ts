const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

/**
 * Minimal API client foundation.
 *
 * Centralizes the backend base URL so no caller hardcodes it.
 * `request` is a thin wrapper around fetch that:
 *   - attaches the Bearer access token when one is provided
 *   - parses JSON responses
 *   - normalizes non-2xx responses into a structured ApiError
 *   - does NOT retry or auto-refresh (those belong to later steps)
 */
export const apiClient = {
  baseURL: API_BASE_URL.replace(/\/$/, ''),

  async request<T>(
    path: string,
    init: RequestInit = {},
    accessToken?: string | null,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      ...init,
      headers,
    });

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const message =
        body && typeof body === 'object'
          ? (body as { message?: string | string[] }).message
          : undefined;
      const messageText = Array.isArray(message)
        ? message.join(', ')
        : message ?? response.statusText;
      const error: ApiError = {
        status: response.status,
        message: messageText || response.statusText,
        details: body,
      };
      throw error;
    }

    return body as T;
  },
};

export default apiClient;