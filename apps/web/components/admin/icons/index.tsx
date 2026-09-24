import { ReactNode } from 'react';

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M16 21v-2a4 4 0 0 0-5.91-3.5L10 18.5V21" />
      <path d="M17.959 20.4A5.976 5.976 0 0 0 18 16.5a5.98 5.98 0 0 0-7-5.92V7a4 4 0 1 1 8 0v.08a5.994 5.994 0 0 0-1.041 9.4z" />
      <path d="M12 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
    </svg>
  );
}

function PropertiesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" strokeLinecap="round" />
    </svg>
  );
}

function BookingsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function PaymentsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M4 10h15M8 15h1l3 3 3-3h1" strokeLinecap="round" />
      <circle cx="15" cy="10" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M10 5H5v14h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 8l4 4-4 4M8 12h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M12 22c1.3 0 2.4-.8 2.8-2H9.2c.4 1.2 1.5 2 2.8 2z" />
      <path d="M5 10V8a7 7 0 0 1 14 0v2c0 3.5 1.2 4.8 2.6 6H2.4C3.8 14.8 5 13.5 5 10z" />
    </svg>
  );
}

export const AdminIcons = {
  dashboard: DashboardIcon,
  users: UsersIcon,
  properties: PropertiesIcon,
  bookings: BookingsIcon,
  payments: PaymentsIcon,
  profile: ProfileIcon,
  logout: LogoutIcon,
  menu: MenuIcon,
  search: SearchIcon,
  bell: BellIcon,
};

export type IconName = keyof typeof AdminIcons;

export function AdminIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}): ReactNode {
  const Icon = AdminIcons[name];
  return <Icon className={className} />;
}

export default AdminIcons;
