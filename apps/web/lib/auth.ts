import { UserRole } from '@prisma/client';

/**
 * User shape returned by the backend auth API.
 * Mirrors AuthUserDto from apps/api/src/auth/dto/auth-response.dto.ts
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'staynest.auth';

/** Read persisted auth state from localStorage (client-side only). */
export function readStoredAuth(): { user: AuthUser | null; tokens: AuthTokens | null } {
  if (typeof window === 'undefined') {
    return { user: null, tokens: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, tokens: null };
    const parsed = JSON.parse(raw) as { user: AuthUser | null; tokens: AuthTokens | null };
    return {
      user: parsed.user ?? null,
      tokens: parsed.tokens ?? null,
    };
  } catch {
    return { user: null, tokens: null };
  }
}

/** Persist auth state to localStorage. */
export function writeStoredAuth(user: AuthUser | null, tokens: AuthTokens | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
  } catch {
    // Ignore storage failures (e.g. private mode).
  }
}

/** Clear persisted auth state. */
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export const ROLES = UserRole;