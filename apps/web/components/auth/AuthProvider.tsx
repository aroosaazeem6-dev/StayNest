'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { authService } from '@/lib/auth-service';
import {
  AuthState,
  AuthTokens,
  AuthUser,
  clearStoredAuth,
  readStoredAuth,
  writeStoredAuth,
} from '@/lib/auth';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  becomeHost: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/** Destination after login/register, keyed by the authenticated user's role. */
function roleHomePath(role: UserRole | undefined): string {
  switch (role) {
    case UserRole.GUEST:
      return '/dashboard';
    case UserRole.HOST:
      return '/host';
    case UserRole.ADMIN:
      return '/admin';
    default:
      return '/';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens;

  // Persist whenever tokens/user change.
  const setAuth = useCallback((u: AuthUser | null, t: AuthTokens | null) => {
    setUser(u);
    setTokens(t);
    writeStoredAuth(u, t);
  }, []);

  const restoreSession = useCallback(async () => {
    const stored = readStoredAuth();
    if (!stored.user || !stored.tokens) {
      setAuth(null, null);
      return;
    }
    try {
      // Validate the access token by fetching /me.
      const me = await authService.me(stored.tokens.accessToken);
      setAuth(me, stored.tokens);
    } catch {
      // Access token invalid/expired. Clear the session.
      setAuth(null, null);
    }
  }, [setAuth]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await restoreSession();
      if (mounted) setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [restoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      setAuth(res.user, res.tokens);
      router.push(roleHomePath(res.user.role));
    },
    [router, setAuth],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await authService.register(email, password, name);
      setAuth(res.user, res.tokens);
      router.push(roleHomePath(res.user.role));
    },
    [router, setAuth],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokens?.refreshToken ?? null;
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      } else {
        await authService.logout(null);
      }
    } catch {
      // Backend logout failed (e.g. network) — still clear local state.
    }
    clearStoredAuth();
    setUser(null);
    setTokens(null);
    router.push('/login');
  }, [router, tokens]);

  const refreshUser = useCallback(async () => {
    if (!tokens) return;
    try {
      const me = await authService.me(tokens.accessToken);
      setUser(me);
      writeStoredAuth(me, tokens);
    } catch {
      // Session invalid — leave state as-is; protected routes will redirect.
    }
  }, [tokens]);

  /**
   * Grant host capability to the authenticated guest.
   *
   * Calls POST /api/v1/auth/become-host, which is idempotent and returns the
   * updated user plus a fresh token pair. Local state and persisted storage
   * are updated so the rest of the app observes isHost=true immediately.
   *
   * Returns the updated user so callers can branch on the new state.
   */
  const becomeHost = useCallback(async (): Promise<AuthUser | null> => {
    if (!tokens?.accessToken) return null;
    try {
      const res = await authService.becomeHost(tokens.accessToken);
      setAuth(res.user, res.tokens);
      return res.user;
    } catch {
      // Failure is surfaced to the caller; local state is intentionally left
      // unchanged so the UI can show an error without losing the session.
      return null;
    }
  }, [tokens, setAuth]);

  const value: AuthContextValue = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    becomeHost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;