import { apiClient } from './api-client';
import { AuthTokens, AuthUser } from './auth';

/** Backend response shape for register/login (AuthResponseDto). */
interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/** Backend response shape for refresh (TokenPairDto). */
interface TokenPairResponse {
  tokens: AuthTokens;
}

/** Backend response shape for logout. */
interface MessageResponse {
  message: string;
}

/**
 * Thin service layer over the StayNest auth API.
 *
 * Endpoints (all under /api/v1):
 *   POST /auth/register  -> { user, tokens }   (201, 409 conflict, 400 validation)
 *   POST /auth/login     -> { user, tokens }   (200, 401 invalid creds)
 *   POST /auth/refresh   -> { tokens }         (201, 401 invalid/expired)
 *   POST /auth/logout    -> { message }       (200)
 *   GET  /auth/me        -> AuthUser          (200, 401)
 */
export const authService = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await apiClient.request<TokenPairResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return res.tokens;
  },

  async logout(refreshToken: string | null): Promise<string> {
    const res = await apiClient.request<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshToken ?? '' }),
    });
    return res.message;
  },

  async me(accessToken: string): Promise<AuthUser> {
    return apiClient.request<AuthUser>('/auth/me', {}, accessToken);
  },
};

export default authService;