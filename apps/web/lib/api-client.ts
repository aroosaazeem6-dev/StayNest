const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

/**
 * Backend response envelope produced by the global ResponseInterceptor
 * (apps/api/src/common/interceptors/response.interceptor.ts):
 *
 *   { success: true, data: <actual payload>, timestamp: "..." }
 *
 * `request` unwraps this envelope and returns the inner `data` to callers,
 * so service layers can work with the real payload directly
 * (e.g. { data: [...], meta: {...} } for paginated endpoints).
 *
 * If the response is not a wrapped envelope (no `success` field), it is
 * returned as-is, which keeps the client tolerant of any non-standard
 * responses.
 */
type Envelope = {
  success?: boolean;
  data?: unknown;
  timestamp?: string;
};

function unwrap(body: unknown): unknown {
  if (body && typeof body === 'object' && 'success' in (body as object)) {
    const env = body as Envelope;
    if (env.success === true && 'data' in env) {
      return env.data;
    }
  }
  return body;
}

/**
 * Minimal API client foundation.
 *
 * Centralizes the backend base URL so no caller hardcodes it.
 * `request` is a thin wrapper around fetch that:
 *   - attaches the Bearer access token when one is provided
 *   - parses JSON responses
 *   - unwraps the global ResponseInterceptor envelope ({ success, data, timestamp })
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
      const unwrapped = unwrap(body);
      const message =
        unwrapped && typeof unwrapped === 'object'
          ? (unwrapped as { message?: string | string[] }).message
          : undefined;
      const messageText = Array.isArray(message)
        ? message.join(', ')
        : message ?? response.statusText;
      const error: ApiError = {
        status: response.status,
        message: messageText || response.statusText,
        details: unwrapped,
      };
      throw error;
    }

    return unwrap(body) as T;
  },
};

export default apiClient;