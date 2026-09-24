'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminIcons } from '@/components/admin/icons';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/properties', label: 'Properties', icon: 'properties' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' },
] as const;

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="flex min-h-screen bg-warm-100">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col',
            'transform bg-forest-900 transition-transform duration-300 ease-in-out',
            'md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="flex h-16 items-center gap-3 border-b border-sage-800/30 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-forest-900">
              <AdminIcons.dashboard className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-sage-50">StayNest</span>
          </div>

          <nav className="flex-1 py-6">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => {
                const Icon = AdminIcons[item.icon as keyof typeof AdminIcons];
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={[
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                        'transition-colors duration-150',
                        isActive
                          ? 'bg-sage-700/20 text-sage-100'
                          : 'text-sage-300 hover:bg-sage-800/20 hover:text-sage-100',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-sage-800/30 p-4">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-200 text-sm font-semibold text-forest-900">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sage-100">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-xs text-sage-400">Administrator</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sage-300 transition-colors hover:bg-sage-800/20 hover:text-sage-100"
            >
              <AdminIcons.logout className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 md:pl-64">
          {/* Top header */}
          <header className="sticky top-0 z-30 border-b border-sage-200 bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg p-2 text-sage-500 hover:bg-sage-50 hover:text-forest-900 md:hidden"
                  aria-label="Open menu"
                >
                  <AdminIcons.menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-forest-900">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-sage-500">{subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="rounded-lg p-2 text-sage-500 hover:bg-sage-50 hover:text-forest-900"
                  aria-label="Search"
                >
                  <AdminIcons.search className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="relative rounded-lg p-2 text-sage-500 hover:bg-sage-50 hover:text-forest-900"
                  aria-label="Notifications"
                >
                  <AdminIcons.bell className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-200 text-sm font-semibold text-forest-900">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminLayout;
