'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminIcons } from '@/components/admin/icons';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' as const },
  { href: '/admin/users', label: 'Users', icon: 'users' as const },
  { href: '/admin/properties', label: 'Properties', icon: 'properties' as const },
  { href: '/admin/bookings', label: 'Bookings', icon: 'bookings' as const },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' as const },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="rounded-xl border border-sage-200 bg-white p-3 shadow-sm">
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = AdminIcons[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-sage-600/10 text-sage-700'
                  : 'text-sage-600 hover:bg-sage-50 hover:text-forest-900'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${
                active ? 'text-sage-700' : 'text-sage-500'
              }`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
