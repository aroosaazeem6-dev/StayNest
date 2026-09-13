'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';

export function Navbar() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container-section flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-600">StayNest</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
          >
            Home
          </Link>
          <Link
            href="/properties"
            className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
          >
            Properties
          </Link>

          {isAuthenticated && user && (
            <>
              {user.role === UserRole.GUEST && (
                <>
                  <Link
                    href="/bookings"
                    className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
                  >
                    Bookings
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
                  >
                    Favorites
                  </Link>
                </>
              )}
              {user.role === UserRole.HOST && (
                <Link
                  href="/host"
                  className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
                >
                  Hosting
                </Link>
              )}
              {user.role === UserRole.ADMIN && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
                >
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-sm text-gray-400">Loading…</span>
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
              >
                {user.name}
              </Link>
              <button
                onClick={() => void logout()}
                className="btn-secondary !py-2 !px-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 transition hover:text-brand-600"
              >
                Login
              </Link>
              <Link href="/register" className="btn-secondary !py-2 !px-4">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;