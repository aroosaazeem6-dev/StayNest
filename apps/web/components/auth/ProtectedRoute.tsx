'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to access this route. Omit to allow any authenticated user. */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthenticated users. */
  loginRedirect?: string;
  /** Where to redirect authenticated-but-unauthorized users. */
  unauthorizedRedirect?: string;
}

/**
 * Client-side route guard.
 *
 * - Unauthenticated users are redirected to /login (or `loginRedirect`).
 * - Authenticated users whose role is not in `allowedRoles` are redirected
 *   to / (or `unauthorizedRedirect`).
 *
 * This is intentionally simple — it does not duplicate the backend JWT guard,
 * which remains the source of truth for API authorization.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  loginRedirect = '/login',
  unauthorizedRedirect = '/',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(loginRedirect);
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(unauthorizedRedirect);
    }
  }, [isAuthenticated, isLoading, user, router, loginRedirect, unauthorizedRedirect, allowedRoles]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container-section flex min-h-[60vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="container-section flex min-h-[60vh] items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          <p className="mt-2 text-gray-600">
            Your role does not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;