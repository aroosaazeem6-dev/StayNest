'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';

interface DashboardTopbarProps {
  onMenuToggle: () => void;
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 21h4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/properties')) return 'Explore Stays';
  if (pathname.startsWith('/bookings')) return 'My Bookings';
  if (pathname.startsWith('/favorites')) return 'Favorites';
  if (pathname.startsWith('/host')) return 'Hosting';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Dashboard';
}

export function DashboardTopbar({
  onMenuToggle,
}: DashboardTopbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageTitle = getPageTitle(pathname);

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  const isHost = Boolean(
    user &&
      (user.isHost === true || user.role === UserRole.HOST),
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#E7E7E0] bg-[#F5F4EF]/95 backdrop-blur-md">
      <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E1E3DC] bg-white text-[#26332D] shadow-sm transition hover:bg-[#F1F3ED] md:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[#879B89] sm:block">
              StayNest
            </p>

            <h1 className="truncate text-xl font-semibold tracking-tight text-[#26332D] sm:text-2xl">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E1E3DC] bg-white text-[#66716A] shadow-sm transition hover:bg-[#F1F3ED] hover:text-[#26332D]"
          >
            <BellIcon />

            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#879B89]" />
          </button>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-[#DDDED7] sm:block" />

          {/* User */}
          {mounted && user ? (
            <Link
              href="/profile"
              className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#879B89] text-sm font-semibold text-[#26332D] shadow-sm">
                {initial}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[150px] truncate text-sm font-semibold text-[#26332D]">
                  {user.name || 'StayNest User'}
                </p>

                <p className="text-[11px] text-[#7A837D]">
                  {isHost ? 'Guest & Host' : 'Guest'}
                </p>
              </div>

              <span className="hidden text-[#87918A] transition group-hover:text-[#26332D] sm:block">
                <ChevronDownIcon />
              </span>
            </Link>
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#DDE5D8]" />
          )}
        </div>
      </div>
    </header>
  );
}