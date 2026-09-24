'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
      <path d="m8.5 13.5 2-5 5-2-2 5-5 2Z" strokeLinejoin="round" />
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" strokeLinecap="round" />
      <path d="M7 14h3M7 18h6" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusHomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v11h14V9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v6M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h16v16H4z" rx="2" />
      <path d="M8 9h8M8 13h5M8 17h3" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M4 7h15" strokeLinecap="round" />
      <path d="M15 13h4" strokeLinecap="round" />
      <circle cx="15" cy="13" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5M4 19h17" strokeLinecap="round" />
      <path d="m7 15 4-4 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 6.7l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.5h-.1a1.7 1.7 0 0 0-1.5 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 5H5v14h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 8l4 4-4 4M8 12h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardSidebar({
  open,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isHost = Boolean(
    user && (user.isHost === true || user.role === UserRole.HOST),
  );

  const isGuest = Boolean(user && user.role === UserRole.GUEST);

  const guestItems: NavItem[] = [
    {
      href: '/properties',
      label: 'Explore Stays',
      icon: <ExploreIcon />,
    },
    {
      href: '/bookings',
      label: 'My Bookings',
      icon: <BookingIcon />,
    },
    {
      href: '/favorites',
      label: 'Favorites',
      icon: <HeartIcon />,
    },
  ];

  const hostItems: NavItem[] = [
    {
      href: '/host',
      label: 'My Properties',
      icon: <HomeIcon />,
    },
    {
      href: '/host?view=add',
      label: 'Add Property',
      icon: <PlusHomeIcon />,
    },
    {
      href: '/host/requests',
      label: 'Booking Requests',
      icon: <RequestsIcon />,
    },
    {
      href: '/host?view=payments',
      label: 'Payments',
      icon: <WalletIcon />,
    },
    {
      href: '/host?view=analytics',
      label: 'Analytics',
      icon: <ChartIcon />,
    },
  ];

  const isActive = (href: string) => {
    const baseHref = href.split('?')[0];

    if (baseHref === '/dashboard') {
      return pathname === '/dashboard';
    }

    if (baseHref === '/host') {
      return pathname === '/host';
    }

    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={[
          'group flex items-center gap-3 rounded-xl px-3.5 py-3',
          'text-[14px] font-medium transition-all duration-200',
          active
            ? 'bg-[#DDE5D8] text-[#26332D] shadow-sm'
            : 'text-white/65 hover:bg-white/8 hover:text-white',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            'transition-colors duration-200',
            active
              ? 'bg-[#879B89]/25 text-[#26332D]'
              : 'text-white/55 group-hover:text-white',
          ].join(' ')}
        >
          {item.icon}
        </span>

        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#17211C]/55 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col',
          'bg-[#26332D] text-white shadow-2xl',
          'transition-transform duration-300 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="group flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDE5D8] text-[#26332D] shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="m3 11 9-8 9 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 10v10h14V10M9 20v-6h6v6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <div>
              <p className="text-[19px] font-semibold tracking-tight">
                StayNest
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Stay comfortably
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-7">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Overview
            </p>

            {renderNavItem({
              href: '/dashboard',
              label: 'Dashboard',
              icon: <DashboardIcon />,
            })}
          </div>

          {isGuest && (
            <div className="mb-7">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Stay
              </p>

              <div className="space-y-1">
                {guestItems.map(renderNavItem)}
              </div>
            </div>
          )}

          {isHost && (
            <div className="mb-7">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Hosting
              </p>

              <div className="space-y-1">
                {hostItems.map(renderNavItem)}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Account
            </p>

            <div className="space-y-1">
              {renderNavItem({
                href: '/profile',
                label: 'Profile',
                icon: <UserIcon />,
              })}

              {renderNavItem({
                href: '/profile?view=settings',
                label: 'Settings',
                icon: <SettingsIcon />,
              })}
            </div>
          </div>
        </nav>

        {/* User / Logout */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#879B89] text-sm font-semibold text-[#26332D]">
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || 'StayNest User'}
              </p>

              <p className="truncate text-[11px] text-white/40">
                {isHost ? 'Guest & Host' : 'Guest'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-medium text-white/60 transition-all duration-200 hover:bg-white/8 hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors group-hover:text-white">
              <LogoutIcon />
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}