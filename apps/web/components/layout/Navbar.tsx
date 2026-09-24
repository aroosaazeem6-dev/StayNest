'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';

function Logo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 11 9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

const navLinks = [
  { href: '/properties', label: 'Explore Stays' },
  { href: '/about', label: 'About Us' },
] as const;

export function Navbar() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleHomePath = (role: UserRole | undefined): string => {
    switch (role) {
      case UserRole.HOST:
        return '/host';
      case UserRole.ADMIN:
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  const homeLink = user ? roleHomePath(user.role) : '/';

  const navLinkClass =
    'text-sm font-medium text-sage-500 transition-colors hover:text-forest-900';

  return (
    <header className="sticky top-0 z-40 border-b border-sage-200/50 bg-white/90 shadow-sm backdrop-blur">
      <div className="container-section flex h-16 items-center justify-between">
        {/* Left: Brand */}
        <Link href={homeLink} className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold text-forest-900">StayNest</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}

          {!isAuthenticated && (
            <Link
              href="/register"
              className="text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
            >
              Become a Host
            </Link>
          )}

          {isAuthenticated && user && user.role === UserRole.ADMIN && (
            <Link
              href="/admin"
              className={navLinkClass}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right: Auth Actions */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-sm text-sage-400">Loading…</span>
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className="hidden text-sm font-medium text-sage-500 transition-colors hover:text-forest-900 sm:inline-block"
              >
                {user.name || 'Profile'}
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
                className="text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-secondary !py-2 !px-4"
              >
                Register
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="ml-2 rounded-lg p-2 text-sage-500 hover:bg-sage-50 hover:text-forest-900 sm:hidden"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-sage-200/50 bg-white sm:hidden">
          <nav className="flex flex-col gap-2 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
              >
                {link.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
              >
                Become a Host
              </Link>
            )}

            {isAuthenticated && user ? (
              <>
                <Link
                  href={roleHomePath(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  className="btn-secondary !py-2 !px-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm font-medium text-sage-500 transition-colors hover:text-forest-900"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
